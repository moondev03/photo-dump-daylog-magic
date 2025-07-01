
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { storage } from "@/utils/storage";
import { DaylogEvent } from "@/types";

const Preview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  
  const [event, setEvent] = useState<DaylogEvent | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dumpTitle, setDumpTitle] = useState("");
  const [dumpMemo, setDumpMemo] = useState("");

  useEffect(() => {
    if (eventId) {
      const foundEvent = storage.getScheduleById(eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        setDumpTitle(`🌅 ${foundEvent.title}의 하루`);
        
        const eventPhotos = storage.getPhotos(eventId);
        setPhotos(eventPhotos);
        
        if (eventPhotos.length === 0) {
          navigate(`/photos?eventId=${eventId}`);
        }
      } else {
        navigate('/calendar');
      }
    }
  }, [eventId, navigate]);

  const proceedToStyle = () => {
    if (!dumpTitle.trim()) {
      return;
    }
    
    // Save title and memo temporarily (in a real app, this would be in a proper state management)
    sessionStorage.setItem('dumpTitle', dumpTitle);
    sessionStorage.setItem('dumpMemo', dumpMemo);
    
    navigate(`/style?eventId=${eventId}`);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-lavender/20 to-mint/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">일정 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-lavender/20 to-mint/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-peach to-sunset bg-clip-text text-transparent">
              Daylog
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            👀 미리보기
          </h2>
          <p className="text-muted-foreground text-lg">
            포토 덤프의 제목과 메모를 입력하고 내용을 확인해보세요
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Settings */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl font-bold">덤프 설정</span>
                <Link to={`/photos?eventId=${eventId}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    사진 업로드로 돌아가기
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  덤프 제목 *
                </label>
                <Input
                  placeholder="예: 🌇 오늘의 정리"
                  value={dumpTitle}
                  onChange={(e) => setDumpTitle(e.target.value)}
                  className="rounded-xl border-2 focus:border-peach"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  메모 (선택)
                </label>
                <Textarea
                  placeholder="이 포토 덤프에 대한 간단한 설명이나 감상을 적어보세요"
                  value={dumpMemo}
                  onChange={(e) => setDumpMemo(e.target.value)}
                  className="rounded-xl border-2 focus:border-peach min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Dump Preview */}
              <div className="bg-white rounded-2xl p-8 shadow-inner border">
                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
                  {dumpTitle || "덤프 제목을 입력하세요"}
                </h2>
                
                {/* Event Info */}
                <div className="text-center text-gray-600 mb-6">
                  <p className="text-lg">{event.title}</p>
                  <p>{new Date(event.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}</p>
                  {(event.startTime || event.endTime) && (
                    <p>{event.startTime} {event.startTime && event.endTime && '- '} {event.endTime}</p>
                  )}
                </div>

                {/* Photos Grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {photos.map((photo, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-md">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Memo */}
                {dumpMemo && (
                  <div className="border-t pt-6 text-gray-700">
                    <p className="text-center italic">{dumpMemo}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 mt-6">
                  Created with Daylog ✨
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button
              onClick={proceedToStyle}
              size="lg"
              disabled={!dumpTitle.trim()}
              className="gradient-peach text-white border-0 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              다음 → 스타일 설정
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
