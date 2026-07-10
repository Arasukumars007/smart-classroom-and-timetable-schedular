from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List

from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.timetable import NotificationOut
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=List[NotificationOut])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


# IMPORTANT: /read-all must be declared BEFORE /{notif_id}/read
# otherwise FastAPI will match "read-all" as a notif_id value
@router.put("/read-all", status_code=200)
async def mark_all_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    return {"message": "All notifications marked as read"}


@router.put("/{notif_id}/read", status_code=200)
async def mark_read(notif_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = await db.get(Notification, notif_id)
    if notif and notif.user_id == current_user.id:
        notif.is_read = True
        await db.flush()
    return {"message": "Marked as read"}
