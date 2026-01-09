export const formatCron = (cron: string): string => {
    const parts = cron.split(' ');
    if (parts.length < 5) return cron;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    const timeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // Case 1: Workdays (1-5)
    if (dayOfWeek === '1-5' && dayOfMonth === '*' && month === '*') {
        return `工作日 ${timeStr}`;
    }

    // Case 2: Daily (*)
    if (dayOfWeek === '*' && dayOfMonth === '*' && month === '*') {
        return `每天 ${timeStr}`;
    }

    // Case 3: Weekly (specific days)
    if (dayOfWeek.includes(',') || (parseInt(dayOfWeek) >= 0 && parseInt(dayOfWeek) <= 6)) {
        const days = dayOfWeek.split(',').map(d => {
            const dayIdx = parseInt(d);
            return weekDays[dayIdx] || d;
        });
        return `每周 [${days.join(', ')}] ${timeStr}`;
    }

    // Fallback for other complex crons
    return cron;
};
