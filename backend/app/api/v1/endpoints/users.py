from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.core.security import get_password_hash
from app.core.dependencies import get_current_admin

router = APIRouter()


@router.get("/admins", response_model=List[UserOut])
async def list_admins(db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    result = await db.execute(select(User).where(User.role == "admin"))
    return result.scalars().all()


@router.post("/admins", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_admin(user_data: UserCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    if user_data.role != "admin":
        raise HTTPException(status_code=400, detail="Role must be admin")

    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role="admin",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.put("/admins/{user_id}", response_model=UserOut)
async def update_admin(user_id: int, user_data: UserUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    user = await db.get(User, user_id)
    if not user or user.role != "admin":
        raise HTTPException(status_code=404, detail="Admin not found")
        
    for k, v in user_data.model_dump(exclude_none=True).items():
        setattr(user, k, v)
        
    await db.flush()
    await db.refresh(user)
    return user


@router.delete("/admins/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(user_id: int, db: AsyncSession = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    user = await db.get(User, user_id)
    if not user or user.role != "admin":
        raise HTTPException(status_code=404, detail="Admin not found")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
    await db.delete(user)
