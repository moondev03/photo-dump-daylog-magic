import { MaChimEvent, PhotoDump } from '@/types';

const STORAGE_KEYS = {
  SCHEDULES: 'machim.schedules',
  PHOTOS: 'machim.photos',
  DUMPS: 'machim.dumps'
} as const;

export const storage = {
  // Schedule operations
  getSchedules: (): MaChimEvent[] => {
    const schedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    return schedules ? JSON.parse(schedules) : [];
  },

  saveSchedules: (schedules: MaChimEvent[]): void => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  },

  addSchedule: (schedule: MaChimEvent): void => {
    const schedules = storage.getSchedules();
    schedules.push(schedule);
    storage.saveSchedules(schedules);
  },

  deleteSchedule: (id: string): void => {
    const schedules = storage.getSchedules().filter(s => s.id !== id);
    storage.saveSchedules(schedules);
  },

  getScheduleById: (id: string): MaChimEvent | undefined => {
    return storage.getSchedules().find(s => s.id === id);
  },

  // Photo operations
  getPhotos: (eventId: string): string[] => {
    const stored = localStorage.getItem(`${STORAGE_KEYS.PHOTOS}.${eventId}`);
    return stored ? JSON.parse(stored) : [];
  },

  savePhotos: (eventId: string, photos: string[]): void => {
    localStorage.setItem(`${STORAGE_KEYS.PHOTOS}.${eventId}`, JSON.stringify(photos));
  },

  // Dump operations
  getDump: (eventId: string): PhotoDump | null => {
    const stored = localStorage.getItem(`${STORAGE_KEYS.DUMPS}.${eventId}`);
    return stored ? JSON.parse(stored) : null;
  },

  saveDump: (dump: PhotoDump): void => {
    localStorage.setItem(`${STORAGE_KEYS.DUMPS}.${dump.eventId}`, JSON.stringify(dump));
  }
};
