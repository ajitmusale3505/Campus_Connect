'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Loader2 } from 'lucide-react';
import Link from 'next/link';

const years = ['FE', 'SE', 'TE', 'BE'] as const;
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['student', 'teacher', 'hod', 'principal']),
  phone: z.string().optional(),
  universityId: z.string().optional(),
  collegeId: z.string().optional(),
  departmentId: z.string().optional(),
  year: z.enum(years).optional(),
  semester: z.coerce.number().optional(),
  teachingSemesters: z.array(z.number()).optional(),
  rollNumber: z.string().optional(),
  enrollmentNumber: z.string().optional(),
  subjectIds: z.array(z.string()).optional(),
});

type Option = { _id: string; name: string; shortName?: string; code?: string; semester?: number; year?: string };

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [universities, setUniversities] = useState<Option[]>([]);
  const [colleges, setColleges] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student',
      phone: '',
      teachingSemesters: [],
      subjectIds: [],
    },
  });

  const role = form.watch('role');
  const universityId = form.watch('universityId');
  const collegeId = form.watch('collegeId');
  const departmentId = form.watch('departmentId');
  const year = form.watch('year');
  const semester = form.watch('semester');
  const teachingSemesters = form.watch('teachingSemesters') || [];
  const selectedSubjectIds = form.watch('subjectIds') || [];

  useEffect(() => {
    fetch('/api/universities')
      .then((res) => res.json())
      .then((data) => setUniversities(data.data || []));
  }, []);

  useEffect(() => {
    if (!universityId) return;
    form.setValue('collegeId', undefined);
    form.setValue('departmentId', undefined);
    fetch(`/api/colleges?universityId=${universityId}`)
      .then((res) => res.json())
      .then((data) => setColleges(data.data || []));
  }, [universityId]);

  useEffect(() => {
    if (!collegeId) return;
    form.setValue('departmentId', undefined);
    fetch(`/api/departments?collegeId=${collegeId}`)
      .then((res) => res.json())
      .then((data) => setDepartments(data.data || []));
  }, [collegeId]);

  useEffect(() => {
    if (!departmentId) {
      setSubjects([]);
      return;
    }

    if (role === 'student' && !semester) {
      setSubjects([]);
      return;
    }

    const params = new URLSearchParams({ departmentId });
    if (role === 'student' && semester) params.set('semester', String(semester));
    if (role === 'student' && year) params.set('year', year);
    fetch(`/api/subjects?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data.data || []);
        if (role !== 'teacher') return;
        const allowedSubjects = (data.data || []).filter((subject: Option) =>
          teachingSemesters.includes(Number(subject.semester))
        );
        const allowedIds = new Set(allowedSubjects.map((subject: Option) => subject._id));
        form.setValue('subjectIds', selectedSubjectIds.filter((id) => allowedIds.has(id)));
      });
  }, [departmentId, semester, year, role, teachingSemesters.join(',')]);

  const academicRequired = ['student', 'teacher', 'hod'].includes(role);
  const showSubjects = role === 'student' || role === 'teacher';

  const canSubmit = useMemo(() => {
    if (!academicRequired) return true;
    if (!universityId || !collegeId || !departmentId) return false;
    if (role === 'hod') return true;
    if (role === 'teacher') return teachingSemesters.length > 0 && selectedSubjectIds.length > 0;
    if (!year || !semester) return false;
    if (role === 'student') return !!form.watch('rollNumber') && !!form.watch('enrollmentNumber');
    return selectedSubjectIds.length > 0;
  }, [academicRequired, universityId, collegeId, departmentId, role, year, semester, teachingSemesters.length, selectedSubjectIds.length, form.watch('rollNumber'), form.watch('enrollmentNumber')]);

  const visibleSubjects = useMemo(() => {
    if (role !== 'teacher') return subjects;
    if (!teachingSemesters.length) return [];
    return subjects.filter((subject) => teachingSemesters.includes(Number(subject.semester)));
  }, [role, subjects, teachingSemesters]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!canSubmit) {
      toast({
        variant: 'destructive',
        title: 'Academic details required',
        description: 'Please complete the SPPU academic selection before registration.',
      });
      return;
    }

    setIsLoading(true);
    const result = await register(values as any);
    if (result.success && result.user) {
      toast({
        title: 'Registration Successful',
        description: result.user.role === 'student' ? 'QR code generated and academic subjects linked.' : 'Redirecting to your dashboard...',
      });
      const dashboardPath = {
        student: '/student/attendance',
        teacher: '/teacher/attendance',
        hod: '/hod',
        principal: '/principal',
      }[result.user.role] || '/login';

      router.push(dashboardPath);
    } else {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'Please check your details or use a different email.',
      });
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <GraduationCap size={32} />
        </div>
        <CardTitle className="text-2xl">Create CampusConnect Account</CardTitle>
        <CardDescription>SPPU-aware onboarding with academic subject linking.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="Minimum 6 characters" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="hod">Head of Department</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {academicRequired && (
              <div className="rounded-lg border p-4">
                <div className="mb-4">
                  <h3 className="font-semibold">Academic Details</h3>
                  <p className="text-sm text-muted-foreground">Select University, College, Department, then year and semester.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField control={form.control} name="universityId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>University</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger></FormControl>
                        <SelectContent>{universities.map((item) => <SelectItem key={item._id} value={item._id}>{item.shortName || item.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="collegeId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>College</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!universityId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger></FormControl>
                        <SelectContent>{colleges.map((item) => <SelectItem key={item._id} value={item._id}>{item.shortName || item.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="departmentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!collegeId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                        <SelectContent>{departments.map((item) => <SelectItem key={item._id} value={item._id}>{item.code} - {item.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                {role !== 'hod' && role !== 'teacher' && (
                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <FormField control={form.control} name="year" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger></FormControl>
                          <SelectContent>{years.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="semester" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger></FormControl>
                          <SelectContent>{semesters.map((item) => <SelectItem key={item} value={String(item)}>Semester {item}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    {role === 'student' && (
                      <>
                        <FormField control={form.control} name="rollNumber" render={({ field }) => (
                          <FormItem><FormLabel>Roll Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="enrollmentNumber" render={({ field }) => (
                          <FormItem><FormLabel>Enrollment Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                      </>
                    )}
                  </div>
                )}

                {role === 'teacher' && (
                  <FormField control={form.control} name="teachingSemesters" render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Teaching Semesters</FormLabel>
                      <FormDescription>Select every semester this teacher handles. Subjects can then be selected across all chosen semesters.</FormDescription>
                      <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-4">
                        {semesters.map((item) => {
                          const checked = field.value?.includes(item) || false;
                          return (
                            <label key={item} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => {
                                  const current = field.value || [];
                                  field.onChange(value ? [...current, item] : current.filter((semesterValue) => semesterValue !== item));
                                }}
                              />
                              Semester {item}
                            </label>
                          );
                        })}
                      </div>
                    </FormItem>
                  )} />
                )}

                {showSubjects && (
                  <FormField control={form.control} name="subjectIds" render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>{role === 'student' ? 'Subjects loaded for confirmation' : 'Assign Subjects'}</FormLabel>
                      <FormDescription>
                        {role === 'student' ? 'Students do not manually join batches. Subjects are read-only from the selected SPPU semester.' : 'Select one or more subjects for this teacher.'}
                      </FormDescription>
                      <div className="grid max-h-56 gap-2 overflow-auto rounded-md border p-3 md:grid-cols-2">
                        {visibleSubjects.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {role === 'teacher' ? 'Select one or more teaching semesters to load subjects.' : 'Select department, year, and semester to load subjects.'}
                          </p>
                        ) : visibleSubjects.map((subject) => (
                          <label key={subject._id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                            <Checkbox
                              checked={role === 'student' || field.value?.includes(subject._id)}
                              disabled={role === 'student'}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                field.onChange(checked ? [...current, subject._id] : current.filter((id) => id !== subject._id));
                              }}
                            />
                            <span><strong>{subject.code}</strong> - {subject.name} <span className="text-muted-foreground">(Sem {subject.semester})</span></span>
                          </label>
                        ))}
                      </div>
                    </FormItem>
                  )} />
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !canSubmit}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="underline">Sign In</Link>
        </div>
      </CardFooter>
    </Card>
  );
}
