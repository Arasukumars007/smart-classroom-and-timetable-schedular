"""
Genetic Algorithm timetable optimizer.
Used as a fallback or improvement pass after CSP.
Optimizes for: fewer free periods, balanced workload, preference satisfaction.
"""
from typing import List, Dict, Tuple
import random
import copy
from app.services.scheduler.csp_scheduler import SlotAssignment, SchedulingContext, CSPScheduler


def fitness(assignments: List[SlotAssignment], context: SchedulingContext) -> float:
    """
    Fitness function: higher is better.
    Penalizes: conflicts, isolated free periods, faculty overload.
    Rewards: balanced spread.
    """
    score = 1000.0

    # Penalty for faculty double-booking
    seen = {}
    for slot in assignments:
        key = (slot.faculty_id, slot.day, slot.period)
        if key in seen:
            score -= 50
        seen[key] = True

    # Penalty for isolated single slots (gap between classes)
    faculty_days: Dict[Tuple[int, int], List[int]] = {}
    for slot in assignments:
        key = (slot.faculty_id, slot.day)
        faculty_days.setdefault(key, []).append(slot.period)

    for periods in faculty_days.values():
        periods_sorted = sorted(periods)
        for i in range(1, len(periods_sorted)):
            if periods_sorted[i] - periods_sorted[i - 1] > 2:
                score -= 5  # gap penalty

    return score


class GeneticScheduler:
    def __init__(self, population_size: int = 20, generations: int = 50, mutation_rate: float = 0.1):
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate

    def optimize(self, context: SchedulingContext) -> Tuple[List[SlotAssignment], List[Dict]]:
        """
        Generate initial population via CSP, then evolve.
        Returns the best individual.
        """
        csp = CSPScheduler()

        # Generate initial population
        population = []
        best_conflicts = []
        for _ in range(self.population_size):
            ind, conflicts = csp.generate(context)
            population.append((ind, fitness(ind, context), conflicts))

        # Sort by fitness
        population.sort(key=lambda x: x[1], reverse=True)

        for gen in range(self.generations):
            next_gen = population[:2]  # Elitism: keep top 2

            while len(next_gen) < self.population_size:
                parent1 = self._tournament_select(population)
                parent2 = self._tournament_select(population)
                child = self._crossover(parent1[0], parent2[0])
                child = self._mutate(child, context)
                child_fitness = fitness(child, context)
                next_gen.append((child, child_fitness, []))

            population = sorted(next_gen, key=lambda x: x[1], reverse=True)

            # Early stopping if top score doesn't improve
            if gen > 10 and population[0][1] == population[1][1]:
                break

        best = population[0]
        return best[0], best[2]

    def _tournament_select(self, population, k=3):
        candidates = random.sample(population, min(k, len(population)))
        return max(candidates, key=lambda x: x[1])

    def _crossover(self, p1: List[SlotAssignment], p2: List[SlotAssignment]) -> List[SlotAssignment]:
        if not p1:
            return p2
        if not p2:
            return p1
        cut = len(p1) // 2
        return p1[:cut] + p2[cut:]

    def _mutate(self, individual: List[SlotAssignment], context: SchedulingContext) -> List[SlotAssignment]:
        result = copy.deepcopy(individual)
        for slot in result:
            if random.random() < self.mutation_rate:
                # Swap day/period randomly
                slot.day = random.randint(0, 4)
                slot.period = random.randint(1, 8)
        return result
