import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import CookieIcon from '@mui/icons-material/Cookie';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_VISUALS = {
    breakfast: { label: 'Breakfast', icon: WbSunnyIcon, color: '#FFB020' },
    lunch: { label: 'Lunch', icon: WbTwilightIcon, color: '#10B981' },
    dinner: { label: 'Dinner', icon: NightsStayIcon, color: '#6366F1' },
    snack: { label: 'Snack', icon: CookieIcon, color: '#EC4899' }
};

const MEAL_ALIASES = {
    snacks: 'snack'
};

export const normalizeMealType = (mealType) => {
    const normalized = String(mealType || '').toLowerCase();
    return MEAL_ALIASES[normalized] || normalized;
};

export const getMealVisualByType = (mealType) => {
    const normalized = normalizeMealType(mealType);
    return MEAL_VISUALS[normalized] || null;
};

export const MEAL_CARD_CONFIG = MEAL_TYPES.map((key) => ({
    key,
    title: MEAL_VISUALS[key].label,
    label: MEAL_VISUALS[key].label,
    icon: MEAL_VISUALS[key].icon,
    color: MEAL_VISUALS[key].color
}));
