import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost/AiPlanet")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploaded_files")
VECTOR_STORE_DIR = os.getenv("VECTOR_STORE_DIR", "vector_stores")