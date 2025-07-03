import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Download, Share2, Calendar } from "lucide-react";
import { storage } from "@/utils/storage";
import { MaChimEvent, PhotoDump } from "@/types";
import html2canvas from "html2canvas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Result = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const selectedDate = searchParams.get('date');
  const dumpRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<MaChimEvent | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dump, setDump] = useState<PhotoDump | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    const loadDump = () => {
      try {
        if (!eventId && !selectedDate) {
          toast({
            title: "오류 발생",
            description: "일정 정보를 찾을 수 없습니다.",
            variant: "destructive"
          });
          navigate('/calendar');
          return;
        }

        if (eventId) {
          // 날짜 기반 임시 이벤트인 경우
          if (eventId.startsWith('date-')) {
            const tempEvent = sessionStorage.getItem('tempEvent');
            const tempDump = sessionStorage.getItem('tempDump');
            
            if (!tempEvent || !tempDump) {
              toast({
                title: "포토 덤프를 찾을 수 없습니다",
                description: "캘린더로 돌아갑니다.",
                variant: "destructive"
              });
              navigate('/calendar');
              return;
            }

            const parsedEvent = JSON.parse(tempEvent) as MaChimEvent;
            const parsedDump = JSON.parse(tempDump) as PhotoDump;
            
            setEvent(parsedEvent);
            setPhotos(parsedEvent.photos || []);
            setDump(parsedDump);

            // 임시 데이터 정리
            sessionStorage.removeItem('tempEvent');
            sessionStorage.removeItem('tempDump');
          } else {
            // 일반 일정인 경우
            const foundEvent = storage.getScheduleById(eventId);
            const foundDump = storage.getDump(eventId);
            
            if (foundEvent && foundDump) {
              setEvent(foundEvent);
              setDump(foundDump);
              const eventPhotos = storage.getPhotos(eventId);
              setPhotos(eventPhotos);
            } else {
              toast({
                title: "포토 덤프를 찾을 수 없습니다",
                description: "캘린더로 돌아갑니다.",
                variant: "destructive"
              });
              navigate('/calendar');
            }
          }
        } else if (selectedDate) {
          // 날짜 기반 모드
          const schedules = storage.getSchedules();
          const dateEvents = schedules.filter(schedule => schedule.date === selectedDate);
          
          if (dateEvents.length > 0) {
            // 해당 날짜의 모든 덤프 찾기
            const dateDumps = dateEvents
              .map(event => ({
                event,
                dump: storage.getDump(event.id)
              }))
              .filter(({ dump }) => dump !== null);
            
            if (dateDumps.length > 0) {
              // 가장 최근에 생성된 덤프 사용
              const latestDump = dateDumps.reduce((latest, current) => {
                if (!latest.dump || !current.dump) return current;
                return new Date(current.dump.createdAt) > new Date(latest.dump.createdAt) ? current : latest;
              });

              if (latestDump.dump && latestDump.event) {
                setEvent(latestDump.event);
                setDump(latestDump.dump);
                const eventPhotos = storage.getPhotos(latestDump.event.id);
                setPhotos(eventPhotos);
              }
            } else {
              toast({
                title: "포토 덤프를 찾을 수 없습니다",
                description: "캘린더로 돌아갑니다.",
                variant: "destructive"
              });
              navigate('/calendar');
            }
          } else {
            toast({
              title: "해당 날짜의 일정을 찾을 수 없습니다",
              description: "캘린더로 돌아갑니다.",
              variant: "destructive"
            });
            navigate('/calendar');
          }
        }
      } catch (error) {
        console.error('Error loading dump:', error);
        toast({
          title: "오류 발생",
          description: "포토 덤프를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
        navigate('/calendar');
      }
    };

    loadDump();
  }, [eventId, selectedDate, navigate, toast]);

  const downloadAsPNG = async () => {
    if (!dumpRef.current) {
      toast({
        title: "다운로드 오류",
        description: "덤프 요소를 찾을 수 없습니다. 페이지를 새로고침 해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      // 로딩 토스트 표시
      toast({
        title: "이미지 생성 중...",
        description: "잠시만 기다려주세요.",
      });

      // html2canvas 옵션 설정
      const options = {
        scale: 2, // 고해상도를 위해 2배 스케일
        useCORS: true, // 외부 이미지 허용
        backgroundColor: null, // 배경 투명도 유지
        logging: false, // 로깅 비활성화
      };

      // HTML 요소를 캔버스로 변환
      const canvas = await html2canvas(dumpRef.current, options);

      // 캔버스를 PNG로 변환
      const dataUrl = canvas.toDataURL("image/png");

      // 다운로드 링크 생성 및 클릭
      const link = document.createElement("a");
      const fileName = `${event?.title || "포토덤프"}_${new Date().toLocaleDateString("ko-KR").replace(/\./g, "")}.png`;
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      // 성공 토스트 표시
      toast({
        title: "다운로드 완료! 🎉",
        description: "포토 덤프가 PNG 파일로 저장되었습니다.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "다운로드 실패",
        description: `다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        variant: "destructive"
      });
    }
  };

  const showShareAlert = () => {
    setShowShareDialog(true);
  };

  const renderPhotos = () => {
    if (!dump) return null;

    const getLayoutClass = () => {
      const baseClass = 'grid';
      const colsClass = {
        'grid4': 'grid-cols-2',
        'grid6': 'grid-cols-2',
        'grid8': 'grid-cols-2',
        'grid9': 'grid-cols-3'
      }[dump.style.layout] || 'grid-cols-2';
      
      return `${baseClass} ${colsClass}`;
    };

    return (
      <div className={getLayoutClass()} style={{ gap: `${dump.style.imageGap}px` }}>
        {dump.photos.map((photo, index) => (
          <div 
            key={index} 
            className="aspect-square overflow-hidden"
            style={{ 
              borderRadius: `${dump.style.imageRadius}px`,
              boxShadow: dump.showFrame ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none'
            }}
          >
            <img
              src={photo}
              alt={`Memory ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  };

  const renderPhotoDump = () => {
    if (!event || !dump || dump.photos.length === 0) return null;

    const containerStyle = {
      backgroundColor: dump.showFrame ? dump.style.backgroundColor : 'transparent',
      fontFamily: dump.style.fontFamily,
      padding: dump.showFrame ? '2rem' : '0',
      boxShadow: dump.showFrame ? 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' : 'none',
      borderRadius: dump.showFrame ? '1rem' : '0'
    };

    return (
      <div className="w-full" style={containerStyle} ref={dumpRef}>
        {dump.showFrame && dump.showTitle && dump.title && (
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-800">
            {dump.title}
          </h1>
        )}

        <div className="mb-8">
          {renderPhotos()}
        </div>

        {dump.showFrame && dump.showMemo && dump.memo && (
          <div className="border-t border-gray-200 pt-6 text-gray-700">
            <p className="text-center text-lg italic leading-relaxed">
              "{dump.memo}"
            </p>
          </div>
        )}

        {dump.showFrame && (
          <div className="text-center text-gray-400 mt-8 text-xs">
            <p>{new Date(dump.createdAt).toLocaleDateString('ko-KR')}</p>
          </div>
        )}
      </div>
    );
  };

  if (!event || !dump) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-peach/20 to-sunset/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">포토 덤프를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-peach/20 to-sunset/20">
      {/* AlertDialog for share feature */}
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🚧 공유 기능 준비 중</AlertDialogTitle>
            <AlertDialogDescription>
              포토 덤프 공유 기능은 현재 개발 중입니다. 더 나은 서비스로 찾아뵙겠습니다.
              <br /><br />
              지원 예정 기능:
              <ul className="list-disc list-inside mt-2">
                <li>Instagram 스토리/게시물 공유</li>
                <li>카카오톡 공유하기</li>
                <li>URL 공유하기</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-peach to-sunset bg-clip-text text-transparent">
              마침 - MaChim
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            ✅ 포토 덤프 완성!
          </h2>
          <p className="text-muted-foreground text-lg">
            당신의 소중한 순간이 아름다운 포토 덤프로 완성되었습니다
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Photo Dump Display */}
          <Card className="glass-effect border-0 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              {renderPhotoDump()}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={downloadAsPNG}
              size="lg"
              className="gradient-peach text-white border-0 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Download className="mr-2 h-5 w-5" />
              📥 PNG 다운로드
            </Button>
            
            <Button
              onClick={showShareAlert}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold rounded-2xl border-2 border-peach text-peach hover:bg-peach hover:text-white transition-all duration-300 hover:scale-105"
            >
              <Share2 className="mr-2 h-5 w-5" />
              📤 공유하기
            </Button>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <Link to="/calendar">
              <Button
                variant="ghost"
                size="lg"
                className="text-lg text-muted-foreground hover:text-peach"
              >
                <Calendar className="mr-2 h-5 w-5" />
                📅 캘린더로 돌아가기
              </Button>
            </Link>
          </div>

          {/* Success Message */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-peach">
                🎉 완성!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                포토 덤프가 성공적으로 생성되었습니다.
              </p>
              <p className="text-sm text-muted-foreground">
                더 많은 일정을 등록하고 다양한 포토 덤프를 만들어보세요! ✨
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Result;
