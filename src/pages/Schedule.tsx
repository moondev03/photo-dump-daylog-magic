
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { CalendarPlus, Trash2, Calendar, Upload, X } from "lucide-react";
import { storage } from "@/utils/storage";
import { DaylogEvent, UploadedPhoto } from "@/types";

interface ScheduleForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  memo: string;
  photos: UploadedPhoto[];
}

const Schedule = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<ScheduleForm[]>([
    {
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      memo: "",
      photos: []
    }
  ]);

  const addSchedule = () => {
    setSchedules([...schedules, {
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      memo: "",
      photos: []
    }]);
  };

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  const updateSchedule = (index: number, field: keyof ScheduleForm, value: any) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    setSchedules(updated);
  };

  const handleFileSelect = (scheduleIndex: number, files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newPhotos: UploadedPhoto[] = [];

    fileArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const photo: UploadedPhoto = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file,
            preview: e.target?.result as string
          };
          newPhotos.push(photo);
          
          if (newPhotos.length === fileArray.filter(f => f.type.startsWith('image/')).length) {
            const currentPhotos = schedules[scheduleIndex].photos;
            const updatedPhotos = [...currentPhotos, ...newPhotos].slice(0, 10); // Max 10 photos
            updateSchedule(scheduleIndex, 'photos', updatedPhotos);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileArray.length === 0 || !fileArray.some(f => f.type.startsWith('image/'))) {
      toast({
        title: "이미지 파일을 선택해주세요",
        description: "JPG, PNG 형식의 이미지만 업로드 가능합니다.",
        variant: "destructive"
      });
    }
  };

  const removePhoto = (scheduleIndex: number, photoId: string) => {
    const currentPhotos = schedules[scheduleIndex].photos;
    const updatedPhotos = currentPhotos.filter(photo => photo.id !== photoId);
    updateSchedule(scheduleIndex, 'photos', updatedPhotos);
  };

  const saveSchedules = () => {
    const validSchedules = schedules.filter(s => s.title && s.date);
    
    if (validSchedules.length === 0) {
      toast({
        title: "일정을 입력해주세요",
        description: "최소한 제목과 날짜는 입력해야 합니다.",
        variant: "destructive"
      });
      return;
    }

    validSchedules.forEach(schedule => {
      const eventId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const event: DaylogEvent = {
        id: eventId,
        title: schedule.title,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        memo: schedule.memo,
        photos: schedule.photos.map(p => p.preview)
      };
      
      storage.addSchedule(event);
      
      // Save photos separately
      if (schedule.photos.length > 0) {
        const photoUrls = schedule.photos.map(photo => photo.preview);
        storage.savePhotos(eventId, photoUrls);
      }
    });

    toast({
      title: "일정이 저장되었습니다! ✨",
      description: `${validSchedules.length}개의 일정이 저장되었습니다.`
    });

    // Clear form
    setSchedules([{
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      memo: "",
      photos: []
    }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cream/20 to-lavender/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-peach to-sunset bg-clip-text text-transparent">
              Daylog
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            📅 일정 등록하기
          </h2>
          <p className="text-muted-foreground text-lg">
            오늘의 일정과 사진을 함께 등록하고 나중에 포토 덤프를 만들어보세요
          </p>
        </div>

        {/* Schedule Forms */}
        <div className="max-w-4xl mx-auto space-y-6">
          {schedules.map((schedule, index) => (
            <Card key={index} className="glass-effect border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold">
                  일정 {index + 1}
                </CardTitle>
                {schedules.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSchedule(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      제목 *
                    </label>
                    <Input
                      placeholder="예: 카페에서 친구와 만남"
                      value={schedule.title}
                      onChange={(e) => updateSchedule(index, 'title', e.target.value)}
                      className="rounded-xl border-2 focus:border-peach"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      날짜 *
                    </label>
                    <Input
                      type="date"
                      value={schedule.date}
                      onChange={(e) => updateSchedule(index, 'date', e.target.value)}
                      className="rounded-xl border-2 focus:border-peach"
                    />
                  </div>

                  {/* Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        시작 시간
                      </label>
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                        className="rounded-xl border-2 focus:border-peach"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        종료 시간
                      </label>
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                        className="rounded-xl border-2 focus:border-peach"
                      />
                    </div>
                  </div>

                  {/* Memo */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      메모 (선택)
                    </label>
                    <Textarea
                      placeholder="일정에 대한 추가 정보나 메모를 입력하세요"
                      value={schedule.memo}
                      onChange={(e) => updateSchedule(index, 'memo', e.target.value)}
                      className="rounded-xl border-2 focus:border-peach min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Photos Section */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-foreground mb-4">
                    사진 ({schedule.photos.length}/10)
                  </label>
                  
                  {/* Upload Zone */}
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center hover:border-peach hover:bg-peach/5 transition-all duration-300">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h4 className="text-lg font-medium mb-2">사진 업로드</h4>
                    <p className="text-muted-foreground mb-4">
                      최대 10장까지 업로드 가능 (JPG, PNG)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleFileSelect(index, e.target.files)}
                      className="hidden"
                      id={`photo-upload-${index}`}
                    />
                    <label htmlFor={`photo-upload-${index}`}>
                      <Button 
                        type="button"
                        variant="outline" 
                        className="border-2 border-peach text-peach hover:bg-peach hover:text-white cursor-pointer"
                        asChild
                      >
                        <span>📸 사진 선택하기</span>
                      </Button>
                    </label>
                  </div>

                  {/* Photo Grid */}
                  {schedule.photos.length > 0 && (
                    <div className="mt-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {schedule.photos.map((photo, photoIndex) => (
                          <div key={photo.id} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={photo.preview}
                                alt={`Upload ${photoIndex + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removePhoto(index, photo.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                              {photoIndex + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Schedule Button */}
          <div className="flex justify-center">
            <Button
              onClick={addSchedule}
              variant="outline"
              className="border-2 border-peach text-peach hover:bg-peach hover:text-white rounded-xl px-6 py-3"
            >
              <CalendarPlus className="mr-2 h-5 w-5" />
              일정 추가하기
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              onClick={saveSchedules}
              size="lg"
              className="gradient-peach text-white border-0 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              ✅ 일정 저장하기
            </Button>
            
            <Link to="/calendar">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold rounded-2xl border-2 border-peach text-peach hover:bg-peach hover:text-white transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              >
                <Calendar className="mr-2 h-5 w-5" />
                📅 캘린더로 이동하기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
