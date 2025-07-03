import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/utils/storage";
import { MaChimEvent } from "@/types";

const Gallery = () => {
  const [schedules, setSchedules] = useState<MaChimEvent[]>([]);
  const [photoDumps, setPhotoDumps] = useState<{
    date: string;
    photos: string[];
    event: MaChimEvent;
  }[]>([]);

  useEffect(() => {
    const loadPhotoDumps = () => {
      const stored = storage.getSchedules();
      setSchedules(stored);

      const dumps = stored.reduce<{
        date: string;
        photos: string[];
        event: MaChimEvent;
      }[]>((acc, schedule) => {
        const photos = storage.getPhotos(schedule.id);
        if (photos.length > 0) {
          acc.push({
            date: schedule.date,
            photos,
            event: schedule,
          });
        }
        return acc;
      }, []);

      // 날짜 기준으로 정렬 (최신순)
      dumps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPhotoDumps(dumps);
    };

    loadPhotoDumps();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-mint/20 to-lavender/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-peach to-sunset bg-clip-text text-transparent">
              마침 - MaChim
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            📸 포토 덤프 갤러리
          </h2>
          <p className="text-muted-foreground text-lg">
            추억이 담긴 포토 덤프를 모아보세요
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {photoDumps.map((dump, index) => (
            <Link to={`/result?date=${dump.date}`} key={index}>
              <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {formatDate(dump.date)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={dump.photos[0]}
                      alt={dump.event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="mt-4 text-muted-foreground line-clamp-1">
                    {dump.event.title}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery; 