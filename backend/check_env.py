from fastapi import FastAPI
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

MEM0_API_KEY = os.getenv("MEM0_API_KEY")
if MEM0_API_KEY:
    print("MEM0_API_KEY is set")
    print(MEM0_API_KEY)
else:
    print("MEM0_API_KEY is not set")
    print(MEM0_API_KEY)



