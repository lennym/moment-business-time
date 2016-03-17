import * as moment from 'moment'

declare module 'moment' {
    interface Moment {
        addWorkingTime(num: number, unit: string): Moment
        subtractWorkingTime(num: number, unit: string): Moment
        isBusinessDay(): boolean
        isWorkingDay(): boolean
        isWorkingTime(): boolean
        isHoliday(): boolean
        lastWorkingDay(): Moment
        nextWorkingDay(): Moment
        lastWorkingTime(): Moment
        nextWorkingTime(): Moment
        workingDiff(comparator: Moment, unit: string, detail: boolean): number
    }
    
    interface MomentLanguage {
        holidays?: string[]
        workinghours?: {
            [key: number]: string[]
        }
    }
}
