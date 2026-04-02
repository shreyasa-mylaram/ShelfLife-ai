import random

class ShelfLifeCalculator:
    def __init__(self):
        # Product configurations
        self.product_config = {
            'mangoes': {'base_shelf_life_days': 15, 'sensitivity': 0.08, 'optimal_temp': 12.5},
            'vaccines': {'base_shelf_life_days': 30, 'sensitivity': 0.12, 'optimal_temp': 5},
            'seafood': {'base_shelf_life_days': 7, 'sensitivity': 0.10, 'optimal_temp': -1},
            'electronics': {'base_shelf_life_days': 365, 'sensitivity': 0.01, 'optimal_temp': 20}
        }

    def calculate(self, product_type: str, days_used: float, cumulative_abuse: float) -> dict:
        config = self.product_config.get(product_type, self.product_config['mangoes'])
        
        base = config['base_shelf_life_days']
        remaining = base - days_used - (cumulative_abuse * config['sensitivity'])
        remaining = max(0, remaining)
        
        health_score = (remaining / base) * 100 if base > 0 else 100
        health_score = max(0, min(100, int(health_score)))
        
        return {
            "shelf_life_remaining": round(remaining, 2),
            "health_score": health_score
        }
