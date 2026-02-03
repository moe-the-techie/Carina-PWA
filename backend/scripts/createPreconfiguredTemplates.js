import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PlanTemplate from '../models/PlanTemplate.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Preconfigured templates based on DrPal external sources
const PRECONFIGURED_TEMPLATES = [
    {
        name: 'Weight Loss Plan - Standard',
        description: 'A balanced weight loss plan with moderate calorie restriction.',
        category: 'Weight Loss',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/Bq8yz8JI2WdvMJENpGNkRjUi',
        defaultGoals: {
            targetCalories: 1500,
            targetProtein: 100,
            targetCarbs: 150,
            targetFats: 50
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Sugar', 'Processed foods', 'Fried foods'],
            useCarefully: ['Whole grains', 'Fruits'],
            allowed: ['Vegetables', 'Lean proteins', 'Water'],
            exercise: ['30 min walking daily', 'Light cardio'],
            notes: 'Follow the plan consistently for best results.'
        },
        defaultWarnings: ['Consult doctor before starting', 'Not suitable for diabetics without adjustment'],
        tags: ['weight-loss', 'standard', 'balanced']
    },
    {
        name: 'Weight Loss Plan - Intensive',
        description: 'An intensive weight loss plan with stricter calorie control.',
        category: 'Weight Loss',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/2nwiaTtDSAIaZ44iGtZiisCF',
        defaultGoals: {
            targetCalories: 1200,
            targetProtein: 120,
            targetCarbs: 100,
            targetFats: 40
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Sugar', 'Processed foods', 'Fried foods', 'High-carb foods'],
            useCarefully: ['Fruits', 'Dairy'],
            allowed: ['Vegetables', 'Lean proteins', 'Water', 'Green tea'],
            exercise: ['45 min cardio daily', 'Strength training 3x/week'],
            notes: 'Intensive plan - monitor energy levels closely.'
        },
        defaultWarnings: ['Medical supervision recommended', 'Not for long-term use'],
        tags: ['weight-loss', 'intensive', 'strict']
    },
    {
        name: 'Weight Loss Plan - Low Carb',
        description: 'A low carbohydrate weight loss approach.',
        category: 'Weight Loss',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/9actFHqox0jzCvFxqsf2MMaS',
        defaultGoals: {
            targetCalories: 1400,
            targetProtein: 130,
            targetCarbs: 50,
            targetFats: 80
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Bread', 'Rice', 'Pasta', 'Sugar', 'Potatoes'],
            useCarefully: ['Low-glycemic fruits'],
            allowed: ['Meat', 'Fish', 'Eggs', 'Leafy greens', 'Healthy fats'],
            exercise: ['Moderate cardio', 'Resistance training'],
            notes: 'May experience initial fatigue during carb adaptation.'
        },
        defaultWarnings: ['May cause initial fatigue', 'Stay hydrated'],
        tags: ['weight-loss', 'low-carb', 'ketogenic']
    },
    {
        name: 'Maintenance Plan - Standard',
        description: 'A balanced maintenance plan to sustain current weight.',
        category: 'Maintenance',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/uBVVal6QeGOrtiOu3d6xRuvW',
        defaultGoals: {
            targetCalories: 2000,
            targetProtein: 80,
            targetCarbs: 250,
            targetFats: 65
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Excessive sugar', 'Trans fats'],
            useCarefully: ['Alcohol', 'Desserts'],
            allowed: ['Balanced meals', 'All food groups in moderation'],
            exercise: ['Regular activity 3-4x/week'],
            notes: 'Focus on maintaining healthy habits.'
        },
        defaultWarnings: [],
        tags: ['maintenance', 'balanced', 'sustainable']
    },
    {
        name: 'Weight Gain Plan - Muscle Building',
        description: 'A high-protein plan for healthy weight gain and muscle building.',
        category: 'Weight Gain',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/b9Dfxmnxf1FccO7ono3Rq4oH',
        defaultGoals: {
            targetCalories: 2800,
            targetProtein: 150,
            targetCarbs: 350,
            targetFats: 80
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Empty calories', 'Excessive junk food'],
            useCarefully: [],
            allowed: ['High-protein foods', 'Complex carbs', 'Healthy fats', 'Dairy'],
            exercise: ['Strength training 4-5x/week', 'Limited cardio'],
            notes: 'Eat frequently - 5-6 meals per day.'
        },
        defaultWarnings: ['Increase calories gradually'],
        tags: ['weight-gain', 'muscle-building', 'high-protein']
    },
    {
        name: 'Athletic Performance Plan',
        description: 'Optimized nutrition plan for athletic performance.',
        category: 'Athletic',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/bz4XXeCCWaX2mKxsb5QP9KSA',
        defaultGoals: {
            targetCalories: 2500,
            targetProtein: 140,
            targetCarbs: 300,
            targetFats: 70
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Alcohol', 'Processed foods'],
            useCarefully: ['Caffeine'],
            allowed: ['Lean proteins', 'Complex carbs', 'Electrolyte drinks'],
            exercise: ['Sport-specific training', 'Recovery days'],
            notes: 'Time meals around training sessions.'
        },
        defaultWarnings: ['Adjust based on training intensity'],
        tags: ['athletic', 'performance', 'sports-nutrition']
    },
    {
        name: 'Diabetic-Friendly Plan',
        description: 'A carefully balanced plan suitable for diabetic patients.',
        category: 'Medical',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/A8IaQ3YJfFQYnm8vi8oI1uKd',
        defaultGoals: {
            targetCalories: 1800,
            targetProtein: 90,
            targetCarbs: 180,
            targetFats: 60
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Sugar', 'White bread', 'White rice', 'Sugary drinks'],
            useCarefully: ['Fruits', 'Starchy vegetables'],
            allowed: ['Low-GI foods', 'Whole grains', 'Lean proteins', 'Non-starchy vegetables'],
            exercise: ['Regular moderate exercise', 'Walking after meals'],
            notes: 'Monitor blood sugar levels regularly.'
        },
        defaultWarnings: ['Requires medical supervision', 'Adjust medications as needed'],
        tags: ['medical', 'diabetic', 'low-glycemic']
    },
    {
        name: 'Heart-Healthy Plan',
        description: 'A cardiovascular-friendly nutrition plan.',
        category: 'Medical',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/47V2BLSXRpkZYLB0uxNpVsDF',
        defaultGoals: {
            targetCalories: 1800,
            targetProtein: 80,
            targetCarbs: 220,
            targetFats: 50
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Saturated fats', 'Trans fats', 'High sodium foods', 'Processed meats'],
            useCarefully: ['Red meat', 'Eggs'],
            allowed: ['Fish', 'Olive oil', 'Nuts', 'Whole grains', 'Fruits', 'Vegetables'],
            exercise: ['Cardio 30 min 5x/week', 'Stress management'],
            notes: 'DASH or Mediterranean diet principles.'
        },
        defaultWarnings: ['Monitor blood pressure', 'Consult cardiologist'],
        tags: ['medical', 'heart-healthy', 'low-sodium']
    },
    {
        name: 'High Protein Plan',
        description: 'A high protein plan for muscle preservation and satiety.',
        category: 'General',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/nKaqXn5MMUSi2j0Yqkmc1Pt0',
        defaultGoals: {
            targetCalories: 2000,
            targetProtein: 160,
            targetCarbs: 150,
            targetFats: 70
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Excessive carbs', 'Sugary foods'],
            useCarefully: ['Processed protein sources'],
            allowed: ['Lean meats', 'Fish', 'Eggs', 'Greek yogurt', 'Legumes', 'Protein supplements'],
            exercise: ['Strength training recommended'],
            notes: 'Distribute protein evenly across meals.'
        },
        defaultWarnings: ['Stay well hydrated', 'May not be suitable for kidney issues'],
        tags: ['high-protein', 'muscle-preservation', 'general']
    },
    {
        name: 'Vegetarian Plan',
        description: 'A balanced vegetarian nutrition plan.',
        category: 'General',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/GuA5xBzw6XJ9EpF4NtyiiOxQ',
        defaultGoals: {
            targetCalories: 1800,
            targetProtein: 70,
            targetCarbs: 250,
            targetFats: 60
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Meat', 'Fish', 'Poultry'],
            useCarefully: ['Processed vegetarian alternatives'],
            allowed: ['Legumes', 'Tofu', 'Dairy', 'Eggs', 'Whole grains', 'Nuts', 'Seeds'],
            exercise: ['Regular activity as tolerated'],
            notes: 'Ensure adequate B12 and iron intake.'
        },
        defaultWarnings: ['Monitor B12 levels', 'May need supplements'],
        tags: ['vegetarian', 'plant-based', 'balanced']
    },
    {
        name: 'Anti-Inflammatory Plan',
        description: 'A nutrition plan focused on reducing inflammation.',
        category: 'Medical',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/tZqtXlaKyFsSYPZxmDxjDdvB',
        defaultGoals: {
            targetCalories: 1800,
            targetProtein: 80,
            targetCarbs: 200,
            targetFats: 70
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Refined sugars', 'Processed foods', 'Red meat', 'Alcohol'],
            useCarefully: ['Dairy', 'Gluten'],
            allowed: ['Fatty fish', 'Olive oil', 'Berries', 'Leafy greens', 'Turmeric', 'Ginger'],
            exercise: ['Low-impact exercise', 'Yoga', 'Swimming'],
            notes: 'Focus on omega-3 rich foods.'
        },
        defaultWarnings: ['Results may take several weeks'],
        tags: ['medical', 'anti-inflammatory', 'healing']
    },
    {
        name: 'General Wellness Plan',
        description: 'A general wellness and balanced nutrition plan.',
        category: 'General',
        duration: 4,
        sourceUrl: 'https://patient.drpal.co/s/82IzYjpJUeU3odYzfuF14ZgC',
        defaultGoals: {
            targetCalories: 2000,
            targetProtein: 80,
            targetCarbs: 250,
            targetFats: 65
        },
        defaultWeeklyPlan: {
            saturday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            sunday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            monday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            tuesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            wednesday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            thursday: { breakfast: '', lunch: '', dinner: '', snack: '' },
            friday: { breakfast: '', lunch: '', dinner: '', snack: '' }
        },
        defaultRecommendations: {
            avoid: ['Excessive processed foods', 'Added sugars'],
            useCarefully: ['Alcohol', 'Caffeine'],
            allowed: ['Balanced diet from all food groups', 'Plenty of water'],
            exercise: ['150 min moderate activity per week'],
            notes: 'Focus on whole, unprocessed foods.'
        },
        defaultWarnings: [],
        tags: ['general', 'wellness', 'balanced', 'healthy-lifestyle']
    }
];

async function createPreconfiguredTemplates() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find an admin user to set as the creator
        const adminUser = await User.findOne({ role: 'admin' });
        
        if (!adminUser) {
            console.error('Error: No admin user found. Please create an admin user first.');
            console.log('Run: node scripts/createAdminUser.js');
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`Using admin user: ${adminUser.name} (${adminUser.email})`);
        console.log('');
        console.log('Creating preconfigured templates...');
        console.log('='.repeat(50));

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const templateData of PRECONFIGURED_TEMPLATES) {
            try {
                // Check if template with same name already exists
                const existingTemplate = await PlanTemplate.findOne({ 
                    name: templateData.name 
                });

                if (existingTemplate) {
                    console.log(`⏭️  Skipped (already exists): ${templateData.name}`);
                    skipped++;
                    continue;
                }

                // Create the template
                const newTemplate = new PlanTemplate({
                    ...templateData,
                    createdBy: adminUser._id,
                    isActive: true
                });

                await newTemplate.save();
                console.log(`✅ Created: ${templateData.name}`);
                created++;
            } catch (error) {
                console.error(`❌ Error creating "${templateData.name}":`, error.message);
                errors++;
            }
        }

        console.log('');
        console.log('='.repeat(50));
        console.log('Summary:');
        console.log(`  ✅ Created: ${created}`);
        console.log(`  ⏭️  Skipped: ${skipped}`);
        console.log(`  ❌ Errors: ${errors}`);
        console.log(`  📊 Total: ${PRECONFIGURED_TEMPLATES.length}`);

        await mongoose.disconnect();
        console.log('');
        console.log('Done! Disconnected from MongoDB.');
        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the script
createPreconfiguredTemplates();
