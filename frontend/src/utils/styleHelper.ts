export const getEnvColor = (envName: string) => {
    const name = envName.toLowerCase();
    
    // Production / Formal -> Red/Orange (Caution)
    if (name.includes('正式') || name.includes('prod') || name.includes('online')) {
        return {
            bg: 'bg-orange-100 dark:bg-orange-900/30',
            text: 'text-orange-700 dark:text-orange-300',
            border: 'border-orange-200 dark:border-orange-800'
        };
    }
    
    // Test / UAT / Dev -> Green/Teal (Safe)
    if (name.includes('测试') || name.includes('test') || name.includes('dev') || name.includes('uat')) {
        return {
            bg: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-700 dark:text-green-300',
            border: 'border-green-200 dark:border-green-800'
        };
    }

    // Default -> Purple/Blue
    return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800'
    };
};
