import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/utils/storage";
import { MaChimEvent } from "@/types";
import { Calendar, Camera, Clock, FileText } from "lucide-react";

const Schedules = () => {
  const [schedules, setSchedules] = useState<MaChimEvent[]>([]);

  useEffect(() => {
    // 저장된 일정 불러오기
    const savedSchedules = storage.getSchedules();
    // 날짜 기준 내림차순 정렬
    const sortedSchedules = savedSchedules.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    setSchedules(sortedSchedules);
  }, []);

  // 포토 덤프 존재 여부 확인
  const hasPhotoDump = (eventId: string) => {
    return storage.getDump(eventId) !== null;
  };

  // 포토 수 확인
  const getPhotoCount = (eventId: string) => {
    return storage.getPhotos(eventId)?.length || 0;
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 시간 포맷팅
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-peach/20 to-sunset/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-peach to-sunset bg-clip-text text-transparent">
              마침 - MaChim
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            📅 등록된 일정
          </h2>
          <p className="text-muted-foreground text-lg">
            등록된 일정과 포토 덤프를 확인해보세요
          </p>
        </div>

        {/* Schedule List */}
        <div className="max-w-4xl mx-auto space-y-6">
          {schedules.length === 0 ? (
            <Card className="glass-effect border-0 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">등록된 일정이 없습니다</p>
                <Link to="/calendar">
                  <Button 
                    variant="outline" 
                    className="mt-4"
                  >
                    일정 등록하기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            schedules.map((schedule) => (
              <Card key={schedule.id} className="glass-effect border-0 shadow-lg overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Date and Time */}
                    <div className="flex-shrink-0 text-center md:text-left">
                      <div className="text-lg font-medium text-muted-foreground">
                        {formatDate(schedule.date)}
                      </div>
                      {(schedule.startTime || schedule.endTime) && (
                        <div className="flex items-center justify-center md:justify-start text-sm text-muted-foreground mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(schedule.startTime)}
                          {schedule.endTime && ` - ${formatTime(schedule.endTime)}`}
                        </div>
                      )}
                    </div>

                    {/* Title and Memo */}
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold mb-2">
                        {schedule.title}
                      </h3>
                      {schedule.memo && (
                        <div className="flex items-start text-muted-foreground">
                          <FileText className="h-4 w-4 mr-1 mt-1" />
                          <p className="text-sm">{schedule.memo}</p>
                        </div>
                      )}
                    </div>

                    {/* Photo Dump Status */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        <Camera className="h-4 w-4 inline mr-1" />
                        사진 {getPhotoCount(schedule.id)}장
                      </div>
                      {hasPhotoDump(schedule.id) ? (
                        <Link to={`/result?eventId=${schedule.id}`}>
                          <Button 
                            size="sm"
                            className="gradient-peach text-white border-0"
                          >
                            포토 덤프 보기
                          </Button>
                        </Link>
                      ) : getPhotoCount(schedule.id) > 0 ? (
                        <Link to={`/style?eventId=${schedule.id}`}>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="border-peach text-peach hover:bg-peach hover:text-white"
                          >
                            포토 덤프 만들기
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/photos?eventId=${schedule.id}`}>
                          <Button 
                            size="sm"
                            variant="outline"
                          >
                            사진 업로드
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedules; 