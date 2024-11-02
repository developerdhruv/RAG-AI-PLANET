# PDF Conversational Chatbot
This project provides a conversational chatbot that takes in a PDF, indexes its contents, and answers questions based on the document's text. The application is built with FastAPI for the backend and React for the frontend. It utilizes vector embeddings for natural language understanding and FAISS for similarity search.
## Features
* PDF Upload: Upload a PDF file for indexing and question-answering.
* Question-Answering: Asks questions about the PDF content and receives responses.
* Easy Switch between pdf's ,chat realtime.
* Vector Store with FAISS: For efficient document indexing and similarity search.
## Tech Stack
### Frontend
* Frontend(ReactJS)
* Lucideicons
* Tailwind
* AXIOS for API calls
### Backend
* FastAPI
* SQLAlchemy
* PostgrSQL
* Langchain
* FAISS Vector Store
* Hugging Face Embeddings
* OLLAMA LLM




## Setup
### Prerequisites
* Node.js (v16 or higher)
* Python (v3.10 or higher)
* PostgreSQL
* Ollama With Llama2



```
git clone https://github.com/developerdhruv/RAG-AI-PLANET
cd RAG-AI-PLANET
```
### Backend Setup
Setup .env and store following data.
```
DATABASE_URL = postgresql://user:password@localhost/AiPlanet
UPLOAD_DIR =uploaded_files
VECTOR_STORE_DIR=vector_stores
```

```
(# Create a virtual Environment to avoid dependencied issues.)
cd Backend
pip install -r requirements.txt
python main.py
```
Server Started...
### Frontend Setup
Install Dependencies
```
npm install
```
Run Application
```
npm start
```
The App should be running at Port 3000 or other.

## API Endpoints
Document Management
```
POST /upload/
- Upload new PDF documents
- Returns: document_id, filename

GET /documents
- Retrieve list of uploaded documents
- Returns: Array of document metadata
```
Chat Interaction

```
POST /ask
- Send questions about documents
- Payload: { document_id, question }
- Returns: { answer, sources }

```


## Architecture
![Architecture](https://github.com/developerdhruv/RAG-AI-PLANET/blob/main/DIAGRAM.png)


## Security Consideration
* Input validation for PDF uploads
* Rate limiting on API endpoints
* Secure database connections
* Sanitized user inputs
* Protected file storage

## DEMO VIDEO AND SNIPPETS


https://github.com/user-attachments/assets/919de13e-9bf7-4feb-9ec2-8161618c8b8b


### In case of any issue please contact at <a href="mailto:dhruvkumar9115@gmail.com">Dhruv Kumar</a>
