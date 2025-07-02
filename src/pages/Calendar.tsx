import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight, Trash2, Camera } from "lucide-react";
import { storage } from "@/utils/storage";
import { MaChimEvent } from "@/types";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<MaChimEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSchedules, setSelectedSchedules] = useState<MaChimEvent[]>([]);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = () => {
    const stored = storage.getSchedules();
    setSchedules(stored);
  };

  const getMonthSchedules = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.getFullYear() === year && scheduleDate.getMonth() === month;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getSchedulesForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setSelectedSchedules(getSchedulesForDate(day));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const deleteSchedule = (id: string) => {
    storage.deleteSchedule(id);
    loadSchedules();
    const updatedSelected = selectedSchedules.filter(s => s.id !== id);
    setSelectedSchedules(updatedSelected);
  };

  const getPhotosForDate = (dateStr: string) => {
    const daySchedules = schedules.filter(schedule => schedule.date === dateStr);
    const allPhotos: string[] = [];
    daySchedules.forEach(schedule => {
      const photos = storage.getPhotos(schedule.id);
      allPhotos.push(...photos);
    });
    return allPhotos;
  };

  const getDumpForDate = (dateStr: string) => {
    const dumps = schedules
      .filter(schedule => schedule.date === dateStr)
      .map(schedule => ({
        event: schedule,
        dump: storage.getDump(schedule.id)
      }))
      .filter(({ dump }) => dump !== null);

    if (dumps.length === 0) return null;

    // 가장 최근에 생성된 덤프 반환
    return dumps.reduce((latest, current) => {
      if (!latest.dump || !current.dump) return current;
      return new Date(current.dump.createdAt) > new Date(latest.dump.createdAt) ? current : latest;
    }).dump;
  };

  const renderPhotoDumpButton = (dateStr: string) => {
    const photos = getPhotosForDate(dateStr);
    if (photos.length === 0) return null;

    const dump = getDumpForDate(dateStr);
    const buttonText = dump ? '📸 이 날의 포토 덤프 보기' : '📸 이 날의 포토 덤프 만들기';
    const buttonLink = dump ? `/result?date=${dateStr}` : `/photos?date=${dateStr}`;

    return (
      <Link to={buttonLink}>
        <Button 
          size="lg" 
          className="gradient-peach text-white border-0 rounded-xl w-full mt-4"
        >
          <Camera className="mr-2 h-5 w-5" />
          {buttonText}
        </Button>
      </Link>
    );
  };

  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

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
            📅 일정 캘린더
          </h2>
          <p className="text-muted-foreground text-lg">
            등록된 일정을 확인하고 포토 덤프를 만들어보세요
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">
                    {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      오늘
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth().map((day, index) => {
                    if (day === null) {
                      return <div key={index} className="h-16"></div>;
                    }
                    
                    const daySchedules = getSchedulesForDate(day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    const isSelected = selectedDate === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    
                    return (
                      <button
                        key={day}
                        onClick={() => handleDateClick(day)}
                        className={`h-16 p-1 rounded-lg border-2 text-left transition-all duration-200 hover:scale-105 ${
                          isSelected 
                            ? 'border-peach bg-peach/20' 
                            : isToday 
                              ? 'border-sunset bg-sunset/20' 
                              : 'border-border hover:border-peach/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{day}</div>
                        {daySchedules.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {daySchedules.slice(0, 2).map((_, i) => (
                              <div key={i} className="w-2 h-2 bg-peach rounded-full"></div>
                            ))}
                            {daySchedules.length > 2 && (
                              <div className="text-xs text-peach">+{daySchedules.length - 2}</div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Details */}
          <div className="space-y-6">
            {selectedDate ? (
              <>
                <Card className="glass-effect border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {new Date(selectedDate).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedSchedules.length === 0 ? (
                      <p className="text-muted-foreground">이 날에는 등록된 일정이 없습니다.</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedSchedules.map(schedule => (
                          <Card key={schedule.id} className="border border-border/50">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-lg">{schedule.title}</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSchedule(schedule.id)}
                                  className="text-destructive hover:text-destructive p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {(schedule.startTime || schedule.endTime) && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {schedule.startTime && `${schedule.startTime}`}
                                  {schedule.startTime && schedule.endTime && ' - '}
                                  {schedule.endTime && `${schedule.endTime}`}
                                </p>
                              )}
                              
                              {schedule.memo && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {schedule.memo}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        
                        {/* 날짜별 포토 덤프 버튼 */}
                        {renderPhotoDumpButton(selectedDate)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass-effect border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    날짜를 선택하면 해당 일정을 확인할 수 있습니다
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">빠른 액션</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link to="/schedule">
                  <Button variant="outline" className="w-full border-2 border-peach text-peach hover:bg-peach hover:text-white">
                    ➕ 새 일정 등록
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    🏠 홈으로 돌아가기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
