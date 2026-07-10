from fastapi import APIRouter
from app.api.v1.endpoints import auth, academic, resources, timetable, analytics, notifications, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(academic.router, prefix="/academic", tags=["Academic"])
api_router.include_router(resources.router, prefix="/resources", tags=["Resources"])
api_router.include_router(timetable.router, prefix="/timetable", tags=["Timetable"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
