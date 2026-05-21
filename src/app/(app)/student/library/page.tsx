
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, Download, Search, Eye, ExternalLink, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';

interface Material {
  _id: string;
  title: string;
  subject: string;
  description: string;
  fileUrl: string;
  fileType: 'pdf' | 'ppt' | 'doc' | 'video' | 'other';
  class: string;
  semester?: string;
  uploadDate: Date;
  views: number;
  teacherId?: {
    name: string;
    email: string;
  };
}

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [searchTerm, subjectFilter, fileTypeFilter, materials]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/materials');
      const data = await response.json();

      if (data.success) {
        setMaterials(data.data);
        setFilteredMaterials(data.data);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: "Error",
        description: "Failed to fetch materials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = materials;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (material) =>
          material.title.toLowerCase().includes(term) ||
          material.subject.toLowerCase().includes(term) ||
          material.description?.toLowerCase().includes(term) ||
          material.class.toLowerCase().includes(term) ||
          material.teacherId?.name.toLowerCase().includes(term)
      );
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter((material) => material.subject === subjectFilter);
    }

    // File type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter((material) => material.fileType === fileTypeFilter);
    }

    setFilteredMaterials(filtered);
  };

  const handleViewMaterial = async (material: Material) => {
    // Increment view count
    try {
      await fetch('/api/materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: material._id, action: 'incrementViews' }),
      });

      // Open the material in a new tab
      window.open(material.fileUrl, '_blank');

      // Update local state
      setMaterials(prev =>
        prev.map(m => m._id === material._id ? { ...m, views: m.views + 1 } : m)
      );
    } catch (error) {
      console.error('Error opening material:', error);
      // Still open the material even if view increment fails
      window.open(material.fileUrl, '_blank');
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'ppt':
        return '📊';
      case 'doc':
        return '📝';
      case 'video':
        return '🎥';
      default:
        return '📎';
    }
  };

  const getFileTypeBadgeColor = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ppt':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'doc':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'video':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get unique subjects for filter
  const uniqueSubjects = Array.from(new Set(materials.map(m => m.subject))).sort();

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Digital Library</h1>
          <p className="text-muted-foreground">Browse and download course materials, papers, and more.</p>
        </div>
        <Button variant="outline" onClick={fetchMaterials}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by title, subject, teacher, or description..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {uniqueSubjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="ppt">PowerPoint</SelectItem>
            <SelectItem value="doc">Document</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">No materials found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm || subjectFilter !== 'all' || fileTypeFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Teachers will upload materials here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Showing {filteredMaterials.length} of {materials.length} materials
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMaterials.map((material) => (
              <Card key={material._id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{getFileTypeIcon(material.fileType)}</div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        by {material.teacherId?.name || 'Unknown Teacher'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{material.subject}</Badge>
                      <Badge variant="outline">{material.class}</Badge>
                      <Badge className={getFileTypeBadgeColor(material.fileType)}>
                        {material.fileType.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {material.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {material.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{material.views} views</span>
                      </div>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(material.uploadDate), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleViewMaterial(material)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Material
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
