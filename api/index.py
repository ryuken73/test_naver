"""
Vercel 서버리스 진입점.
backend 패키지의 FastAPI app을 그대로 노출합니다.
"""
import sys
import os

# 프로젝트 루트를 PYTHONPATH에 추가 (Vercel 빌드 환경 대응)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app  # noqa: F401, E402
