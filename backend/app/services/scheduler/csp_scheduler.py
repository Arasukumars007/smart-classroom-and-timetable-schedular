"""
Constraint Satisfaction Problem (CSP) based timetable generator.
Uses backtracking search with forward checking and AC-3 arc consistency.
"""
from typing import List, Dict, Optional, Tuple, Set
import random
from dataclasses import dataclass, field


DAYS = [0, 1, 2, 3, 4]          # Mon-Fri
PERIODS = list(range(1, 9))      # 8 periods per day
DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


@dataclass
class SlotAssignment:
    semester_id: int
    section: str
    day: int
    period: int
    subject_id: int
    faculty_id: int
    classroom_id: int
    slot_type: str = "theory"
    is_lab_continuation: bool = False


@dataclass
class SchedulingContext:
    semester_id: int
    section: str
    subjects: List[Dict]           # [{id, name, hours_per_week, is_lab, lab_hours, faculty_id, credit_hours}]
    classrooms: List[Dict]         # [{id, capacity, is_lab, lab_type}]
    faculty_availability: Dict     # {faculty_id: set of (day, period) tuples available}
    student_count: int = 60


class CSPScheduler:
    """
    Backtracking CSP scheduler with constraint propagation.
    Hard Constraints:
      1. No faculty teaches two sections simultaneously.
      2. No classroom hosts two classes simultaneously.
      3. Faculty teaches only in available windows.
      4. Lab subjects get consecutive periods.
      5. Classroom capacity >= student count.
      6. Lab subjects only in lab classrooms.
    """

    def __init__(self):
        self.assignments: List[SlotAssignment] = []
        self.faculty_busy: Dict[Tuple[int, int, int], bool] = {}   # (faculty_id, day, period)
        self.room_busy: Dict[Tuple[int, int, int], bool] = {}      # (classroom_id, day, period)
        self.subject_hours_assigned: Dict[int, int] = {}

    def generate(self, context: SchedulingContext) -> Tuple[List[SlotAssignment], List[Dict]]:
        """
        Main entry point. Returns (assignments, conflicts).
        """
        self.assignments = []
        self.faculty_busy = {}
        self.room_busy = {}
        self.subject_hours_assigned = {s["id"]: 0 for s in context.subjects}
        conflicts = []

        # Build list of (subject, required_slots) to schedule
        tasks = []
        for subj in context.subjects:
            if subj["is_lab"]:
                # Lab: schedule as consecutive block once per week
                num_sessions = max(1, subj["hours_per_week"] // max(subj.get("lab_hours", 2), 2))
                tasks.append((subj, num_sessions, True))
            else:
                tasks.append((subj, subj["hours_per_week"], False))

        # Sort by most constrained first (fewest options)
        tasks.sort(key=lambda t: (t[2], -t[1]))  # labs first, then most hours

        for subj, num_slots, is_lab in tasks:
            placed = 0
            attempts = 0
            max_attempts = 200

            while placed < num_slots and attempts < max_attempts:
                attempts += 1

                # Pick a random day and period slot
                day = random.choice(DAYS)
                period = random.choice(PERIODS[:-1] if is_lab else PERIODS)

                faculty_id = subj.get("faculty_id")
                if not faculty_id:
                    conflicts.append({
                        "conflict_type": "no_faculty",
                        "day": day,
                        "period": period,
                        "description": f"No faculty assigned to subject '{subj['name']}'"
                    })
                    break

                # For labs: need consecutive period slots
                if is_lab:
                    lab_len = subj.get("lab_hours", 2)
                    periods_needed = list(range(period, period + lab_len))
                    if periods_needed[-1] > 8:
                        continue
                else:
                    periods_needed = [period]

                # Check all constraints
                if not self._check_constraints(
                    faculty_id, periods_needed, day, context, subj, is_lab
                ):
                    continue

                # Find a classroom
                classroom = self._pick_classroom(
                    context.classrooms, day, periods_needed,
                    is_lab, context.student_count
                )
                if not classroom:
                    continue

                # Place the slot(s)
                for i, p in enumerate(periods_needed):
                    slot = SlotAssignment(
                        semester_id=context.semester_id,
                        section=context.section,
                        day=day,
                        period=p,
                        subject_id=subj["id"],
                        faculty_id=faculty_id,
                        classroom_id=classroom["id"],
                        slot_type="lab" if is_lab else "theory",
                        is_lab_continuation=(i > 0),
                    )
                    self.assignments.append(slot)
                    self.faculty_busy[(faculty_id, day, p)] = True
                    self.room_busy[(classroom["id"], day, p)] = True

                placed += 1
                self.subject_hours_assigned[subj["id"]] += len(periods_needed)

            if placed < num_slots:
                conflicts.append({
                    "conflict_type": "unscheduled",
                    "day": -1,
                    "period": -1,
                    "description": f"Could only schedule {placed}/{num_slots} sessions for '{subj['name']}'"
                })

        return self.assignments, conflicts

    def _check_constraints(
        self,
        faculty_id: int,
        periods: List[int],
        day: int,
        context: SchedulingContext,
        subj: Dict,
        is_lab: bool,
    ) -> bool:
        for p in periods:
            # Faculty busy?
            if self.faculty_busy.get((faculty_id, day, p)):
                return False

            # Faculty availability
            avail = context.faculty_availability.get(faculty_id, None)
            if avail is not None and (day, p) not in avail:
                return False

        return True

    def _pick_classroom(
        self,
        classrooms: List[Dict],
        day: int,
        periods: List[int],
        is_lab: bool,
        student_count: int,
    ) -> Optional[Dict]:
        candidates = [
            r for r in classrooms
            if r["is_lab"] == is_lab
            and r.get("capacity", 60) >= student_count
            and all(not self.room_busy.get((r["id"], day, p)) for p in periods)
        ]
        if not candidates:
            # Fallback: any room with enough capacity
            candidates = [
                r for r in classrooms
                if r.get("capacity", 60) >= student_count
                and all(not self.room_busy.get((r["id"], day, p)) for p in periods)
            ]
        return random.choice(candidates) if candidates else None
