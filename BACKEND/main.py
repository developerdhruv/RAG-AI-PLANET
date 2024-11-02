import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, DateTime, text
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
import shutil
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain_ollama import OllamaLLM
from langchain_community.document_loaders import PyPDFLoader
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv
from config import DATABASE_URL, UPLOAD_DIR , VECTOR_STORE_DIR
# Load environment variables
load_dotenv()

# Database Configuration
DATABASE_URL = DATABASE_URL
UPLOAD_DIR = UPLOAD_DIR
vector_stores = VECTOR_STORE_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)

# SQLAlchemy setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, nullable=False)
    original_name = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    vector_store_path = Column(String, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE documents ADD COLUMN vector_store_path VARCHAR;"))
            conn.commit()
        except Exception as e:
            pass

init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    document_id: int
    question: str

# Initialize LLM model
llm = OllamaLLM(model="llama2", temperature=0.7)

# Initialize embeddings model
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def create_vector_store(documents: List, doc_id: int) -> str:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    texts = text_splitter.split_documents(documents)
    vector_store = FAISS.from_documents(texts, embeddings)
    vector_store_path = f"{vector_stores}/doc_{doc_id}"
    os.makedirs("vector_stores", exist_ok=True)
    vector_store.save_local(vector_store_path)
    return vector_store_path

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    unique_filename = f"{datetime.now().timestamp()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        db = SessionLocal()
        try:
            db_document = Document(
                filename=unique_filename,
                original_name=file.filename
            )
            db.add(db_document)
            db.commit()
            db.refresh(db_document)
            
            vector_store_path = create_vector_store(documents, db_document.id)
            db_document.vector_store_path = vector_store_path
            db.commit()
            
            return JSONResponse({
                "message": "File uploaded successfully",
                "document_id": db_document.id,
                "filename": unique_filename
            })
        finally:
            db.close()
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == request.document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        if not os.path.exists(document.vector_store_path):
            raise HTTPException(status_code=404, detail="Vector store not found")
        
        vector_store = FAISS.load_local(
            document.vector_store_path, 
            embeddings,
            allow_dangerous_deserialization=True
        )
        
        retriever = vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 3}
        )
        
        # Updated memory configuration with output_key
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            output_key="answer",  
            return_messages=True
        )
        # qa_chain configuration  
        qa_chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            memory=memory,
            verbose=True,
            return_source_documents=True
        )
        
        result = qa_chain({"question": request.question})
        
        return {
            "answer": result["answer"],
            "sources": [
                {
                    "page": doc.metadata.get("page", 1),
                    "content": doc.page_content[:200] + "..."
                }
                for doc in result.get("source_documents", [])
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/documents")
async def get_documents():
    db = SessionLocal()
    try:
        documents = db.query(Document).all()
        return [
            {
                "id": doc.id,
                "filename": doc.original_name,
                "upload_date": doc.upload_date.isoformat()
            }
            for doc in documents
        ]
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)