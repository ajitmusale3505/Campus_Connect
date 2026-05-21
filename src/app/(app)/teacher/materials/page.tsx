
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Link as LinkIcon, FileText, Download, Eye, Trash2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    fileUrl: '',
    fileType: 'pdf' as 'pdf' | 'ppt' | 'doc' | 'video' | 'other',
    class: '',
    semester: '',
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/materials');
      const data = await response.json();

      if (data.success) {
        setMaterials(data.data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.subject || !formData.fileUrl || !formData.class) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to upload material",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Material uploaded successfully",
      });

      // Reset form
      setFormData({
        title: '',
        subject: '',
        description: '',
        fileUrl: '',
        fileType: 'pdf',
        class: '',
        semester: '',
      });

      // Refresh materials list
      fetchMaterials();
    } catch (error) {
      console.error('Error uploading material:', error);
      toast({
        title: "Error",
        description: "Failed to upload material. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      const response = await fetch(`/api/materials?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to delete material",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Material deleted successfully",
      });

      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: "Failed to delete material. Please try again.",
        variant: "destructive",
      });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Upload Study Material</h1>
          <p className="text-muted-foreground">Share notes, links, and videos with your students.</p>
        </div>
        <Button variant="outline" onClick={fetchMaterials}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Upload New Material</CardTitle>
            <CardDescription>Fill in the details below to upload new study material.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Quantum Physics - Week 3 Notes"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Physics"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class/Course *</Label>
                <Input
                  id="class"
                  placeholder="e.g., CS101 or Grade 10"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester (Optional)</Label>
                <Input
                  id="semester"
                  placeholder="e.g., Spring 2025"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileType">File Type *</Label>
              <Select
                value={formData.fileType}
                onValueChange={(value: any) => setFormData({ ...formData, fileType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="ppt">PowerPoint Presentation</SelectItem>
                  <SelectItem value="doc">Word Document</SelectItem>
                  <SelectItem value="video">Video Link</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL or Link *</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="fileUrl"
                  placeholder="https://drive.google.com/... or YouTube link"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Paste a Google Drive link, YouTube video, or any other accessible URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description or notes about this material..."
                className="min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="ml-auto" disabled={uploading}>
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Publish Material
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">My Uploaded Materials</h2>
        
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : materials.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No materials uploaded yet</p>
              <p className="text-sm text-muted-foreground">
                Upload your first study material using the form above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {materials.map((material) => (
              <Card key={material._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{getFileTypeIcon(material.fileType)}</div>
                      <div>
                        <CardTitle>{material.title}</CardTitle>
                        <CardDescription>
                          {material.subject} • {material.class}
                          {material.semester && ` • ${material.semester}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        <Eye className="h-3 w-3 mr-1" />
                        {material.views} views
                      </Badge>
                      <Badge variant="outline">{material.fileType.toUpperCase()}</Badge>
                    </div>
                  </div>
                </CardHeader>
                {material.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{material.description}</p>
                  </CardContent>
                )}
                <CardFooter className="flex justify-between">
                  <div className="text-xs text-muted-foreground">
                    Uploaded {formatDistanceToNow(new Date(material.uploadDate), { addSuffix: true })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(material.fileUrl, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Open File
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(material._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
