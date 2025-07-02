import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, ArrowRight } from "lucide-react";
import { storage } from "@/utils/storage";
import { MaChimEvent, UploadedPhoto } from "@/types";

const Photos = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  const selectedDate = searchParams.get('date');
  
  const [event, setEvent] = useState<MaChimEvent | null>(null);
  const [dateEvents, setDateEvents] = useState<MaChimEvent[]>([]);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (eventId) {
      // Single event mode
      const foundEvent = storage.getScheduleById(eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        loadExistingPhotos(eventId);
      } else {
        toast({
          title: "일정을 찾을 수 없습니다",
          description: "올바른 일정을 선택해주세요.",
          variant: "destructive"
        });
        navigate('/calendar');
      }
    } else if (selectedDate) {
      // Date-based mode
      const schedules = storage.getSchedules();
      const events = schedules.filter(schedule => schedule.date === selectedDate);
      if (events.length > 0) {
        setDateEvents(events);
        // Load all photos from all events of the selected date
        const allPhotos: string[] = [];
        events.forEach(event => {
          const eventPhotos = storage.getPhotos(event.id) || [];
          allPhotos.push(...eventPhotos);
        });
        // Convert to UploadedPhoto format for display
        setPhotos(allPhotos.map(url => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file: new File([], "photo.jpg"), // Dummy file since we only need the preview
          preview: url
        })));
      } else {
        toast({
          title: "해당 날짜에 일정이 없습니다",
          description: "일정을 먼저 등록해주세요.",
          variant: "destructive"
        });
        navigate('/calendar');
      }
    }
  }, [eventId, selectedDate, navigate]);

  const loadExistingPhotos = (eventId: string) => {
    const existingPhotoUrls = storage.getPhotos(eventId);
    if (existingPhotoUrls.length > 0) {
      const existingPhotos = existingPhotoUrls.map((url, index) => ({
        id: `existing-${index}`,
        file: new File([], `photo-${index}.jpg`),
        preview: url
      }));
      setPhotos(existingPhotos);
    }
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress with quality 0.7 (70% of original)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = () => {
          reject(new Error('이미지 처리 중 오류가 발생했습니다.'));
        };
      };
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    });
  };

  const handleFileSelect = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (fileArray.length === 0) {
      toast({
        title: "이미지 파일을 선택해주세요",
        description: "JPG, PNG 형식의 이미지만 업로드 가능합니다.",
        variant: "destructive"
      });
      return;
    }

    if (photos.length + fileArray.length > 10) {
      toast({
        title: "사진 업로드 제한",
        description: "최대 10장까지만 업로드할 수 있습니다.",
        variant: "destructive"
      });
      return;
    }

    const newPhotos: UploadedPhoto[] = [];

    for (const file of fileArray) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "파일 크기 제한",
          description: `${file.name}은 5MB를 초과합니다.`,
          variant: "destructive"
        });
        continue;
      }

      try {
        // Compress the image
        const compressedDataUrl = await compressImage(file);
        
        newPhotos.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          preview: compressedDataUrl
        });
      } catch (error) {
        console.error('Image compression error:', error);
        toast({
          title: "이미지 압축 오류",
          description: `${file.name} 파일을 처리하는 중 오류가 발생했습니다.`,
          variant: "destructive"
        });
      }
    }

    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos]);
      toast({
        title: "사진이 업로드되었습니다",
        description: `${newPhotos.length}장의 사진이 추가되었습니다.`
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const proceedToStyle = () => {
    if (photos.length === 0) {
      toast({
        variant: "destructive"
      });
      return;
    }

    try {
      if (eventId) {
        // Single event mode
        storage.savePhotos(eventId, photos.map(photo => photo.preview));
        navigate(`/style?eventId=${eventId}`);
      } else if (selectedDate && dateEvents.length > 0) {
        // Date-based mode - collect all photos from the date's events
        const allPhotos: string[] = [];
        dateEvents.forEach(event => {
          const eventPhotos = storage.getPhotos(event.id) || [];
          allPhotos.push(...eventPhotos);
        });

        if (allPhotos.length === 0) {
          toast({
            title: "사진이 없습니다",
            description: "이 날짜의 일정들에 저장된 사진이 없습니다.",
            variant: "destructive"
          });
          return;
        }

        // Create a temporary event for preview only
        const tempEventId = `date-${selectedDate}-${Date.now()}`;
        const eventTitles = dateEvents.map(event => event.title).join(", ");
        
        const tempEvent: MaChimEvent = {
          id: tempEventId,
          title: `${selectedDate}의 추억 (${eventTitles})`,
          date: selectedDate,
          startTime: "",
          endTime: "",
          memo: `${dateEvents.length}개의 일정: ${eventTitles}`,
          photos: allPhotos
        };
        
        // Store in session storage for style page
        sessionStorage.setItem('tempEvent', JSON.stringify(tempEvent));
        
        // Navigate to style page with the temporary event ID
        navigate(`/style?eventId=${tempEventId}&date=${selectedDate}`);
      }

      toast({
        title: "스타일 설정 페이지로 이동합니다",
        description: "포토 덤프의 스타일을 설정해보세요."
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "오류 발생",
        description: "스타일 설정 페이지로 이동하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const getDisplayTitle = () => {
    if (event) return event.title;
    if (selectedDate && dateEvents.length > 0) {
      return `${new Date(selectedDate).toLocaleDateString('ko-KR')}의 추억`;
    }
    return "포토 덤프";
  };

  const getDisplayDate = () => {
    if (event) return event.date;
    return selectedDate || "";
  };

  if (!event && !selectedDate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-mint/20 to-peach/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">일정 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

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
            {selectedDate ? '📸 포토 덤프 만들기' : '📸 사진 업로드'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {getDisplayTitle()}의 추억을 담은 사진들을 {selectedDate ? '선택해보세요' : '업로드해보세요'}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Event Info */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl font-bold">{getDisplayTitle()}</span>
                <Link to="/calendar">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    캘린더로 돌아가기
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-muted-foreground">
                <p>📅 {new Date(getDisplayDate()).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}</p>
                {event && (event.startTime || event.endTime) && (
                  <p>⏰ {event.startTime} {event.startTime && event.endTime && '- '} {event.endTime}</p>
                )}
                {event && event.memo && (
                  <p>📝 {event.memo}</p>
                )}
                {selectedDate && dateEvents.length > 0 && (
                  <p>📋 {dateEvents.length}개의 일정</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photo Upload Area */}
          {!selectedDate && (
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">사진 업로드 ({photos.length}/10)</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Upload Zone */}
                <div
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    dragOver 
                      ? 'border-peach bg-peach/10 scale-105' 
                      : 'border-muted-foreground/30 hover:border-peach hover:bg-peach/5'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                >
                  <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    사진을 드래그하거나 클릭해서 업로드하세요
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    최대 10장까지 업로드 가능합니다 (JPG, PNG, 최대 5MB)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="border-2 border-peach text-peach hover:bg-peach hover:text-white cursor-pointer"
                      asChild
                    >
                      <span>사진 선택하기</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Grid */}
          {photos.length > 0 && (
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">
                  {selectedDate ? '포토 덤프에 포함된 사진들' : '업로드된 사진들'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                        <img
                          src={photo.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      {!selectedDate && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(photo.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  💡 사진들은 번호 순서대로 포토 덤프에 배치됩니다
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button
              onClick={proceedToStyle}
              size="lg"
              disabled={photos.length === 0}
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

export default Photos;
