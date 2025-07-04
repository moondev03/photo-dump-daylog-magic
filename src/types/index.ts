export interface MaChimEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  memo?: string;
  photos?: string[];
}

export interface PhotoDump {
  id: string;
  eventId: string;
  title: string;
  memo: string;
  showTitle: boolean;
  showMemo: boolean;
  showFrame: boolean;
  style: {
    layout: 'grid4' | 'grid6' | 'grid8' | 'grid9';
    backgroundColor: string;
    fontFamily: string;
    imageGap: number;
    imageRadius: number;
  };
  photos: string[];
  createdAt: string;
}

export interface UploadedPhoto {
  id: string;
  file: File;
  preview: string;
}
