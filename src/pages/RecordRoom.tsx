import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { 
  FileText, 
  UserCheck, 
  Video, 
  AlertTriangle, 
  Search, 
  Plus, 
  Check, 
  X, 
  Calendar,
  GraduationCap,
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
  Filter,
  Edit2,
  Trash2,
  Loader2
} from 'lucide-react';
import '../styles/cards.css';
import type { UserRole } from '../types';
import { loadClasses as fetchClassesFromUtils, Class as UtilsClass } from '../utils/classUtils';

type RecordType = 'results' | 'schoolAttendance' | 'onlineAttendance' | 'discipline';

interface Profile {
  id: string;
  username: string;
  role: UserRole;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  username: string;
  email: string;
  photo_url?: string;
}

interface RecordClass {
  id: string;
  grade: number;
  section: string;
  subject_id: string;
  subject_name: string;
}

interface Result {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  grade: string;
  marks: number;
  total_marks: number;
  test_date: string;
  test_name: string;
  created_at: string;
  profiles?: {
    username: string;
    photo_url?: string;
  };
  subjects?: {
    name: string;
  };
}

interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'leave';
  type: 'school' | 'online';
  created_at: string;
  profiles?: {
    username: string;
    photo_url?: string;
  };
}

interface Discipline {
  id: string;
  student_id: string;
  class_id: string;
  warning_count: number;
  reason: string;
  date: string;
  created_at: string;
  profiles?: {
    username: string;
    photo_url?: string;
  };
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface ClubAttendance {
  id: string;
  club_id: string;
  user_id: string;
  date: string;
  status: string;
  created_at: string;
  profiles?: Profile;
}

interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  joined_at: string;
  profiles?: Profile;
}

interface Club {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  max_capacity: number;
  schedule: string;
  members_count: number;
}

interface StudentProfile {
  id: string;
  username: string;
  email: string;
  photo_url?: string;
}

interface ClassAssignment {
  id: string;
  class_id: string;
  profiles: StudentProfile[];
}

export function RecordRoom() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<RecordType>('results');
  const [classes, setClasses] = useState<RecordClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState<Message | null>(null);
  
  // New result form
  const [newResult, setNewResult] = useState({
    student_id: '',
    subject_id: '',
    grade: '',
    marks: '',
    total_marks: '',
    test_date: new Date().toISOString().split('T')[0],
    test_name: ''
  });

  // New discipline form
  const [newDiscipline, setNewDiscipline] = useState({
    student_id: '',
    warning_count: '1',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchClassesData();
      loadSubjects();
    } else {
      // For students, load their own data
      loadStudentData();
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (selectedClass && isAdmin) {
      loadStudents();
      loadRecords();
    }
  }, [selectedClass, activeTab]);

  const fetchClassesData = async () => {
    setLoading(true);
    try {
      const { classes: loadedClasses, error } = await fetchClassesFromUtils();
      if (error) {
        setMessage({ type: 'error', text: error });
      } else {
        // Convert UtilsClass[] to RecordClass[]
        const recordClasses: RecordClass[] = loadedClasses.map(cls => ({
          id: cls.id,
          grade: cls.grade,
          section: cls.section,
          subject_id: '', // Default empty values for subject_id and subject_name
          subject_name: ''
        }));
        setClasses(recordClasses);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setMessage({ type: 'error', text: 'Failed to load classes' });
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (data) setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadStudents = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_assignments')
        .select(`
          id,
          class_id,
          profiles:user_id (
            id,
            username,
            email,
            photo_url
          )
        `)
        .eq('class_id', selectedClass);
      
      if (error) throw error;
      
      if (data) {
        const assignments = data.map((assignment: any) => ({
          id: assignment.id,
          class_id: assignment.class_id,
          profiles: assignment.profiles ? [assignment.profiles] : []
        })) as ClassAssignment[];
        setStudents(assignments.map(assignment => assignment.profiles).flat());
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setMessage({ type: 'error', text: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load student's results
      const { data: resultsData } = await supabase
        .from('results')
        .select(`
          *,
          subjects(name)
        `)
        .eq('student_id', user.id)
        .order('test_date', { ascending: false });
      
      if (resultsData) setResults(resultsData);

      // Load student's attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
        .order('date', { ascending: false });
      
      if (attendanceData) setAttendances(attendanceData);

      // Load student's discipline records
      const { data: disciplineData } = await supabase
        .from('discipline')
        .select('*')
        .eq('student_id', user.id)
        .order('date', { ascending: false });
      
      if (disciplineData) setDisciplines(disciplineData);
    } catch (error) {
      console.error('Error loading student data:', error);
      setMessage({ type: 'error', text: 'Failed to load student data' });
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      if (activeTab === 'results') {
        const { data } = await supabase
          .from('results')
          .select(`
            *,
            profiles:student_id (username),
            subjects(name)
          `)
          .eq('class_id', selectedClass)
          .order('test_date', { ascending: false });
        
        if (data) setResults(data);
      } 
      else if (activeTab === 'schoolAttendance' || activeTab === 'onlineAttendance') {
        const type = activeTab === 'schoolAttendance' ? 'school' : 'online';
        
        const { data } = await supabase
          .from('attendance')
          .select(`
            *,
            profiles:student_id (username)
          `)
          .eq('class_id', selectedClass)
          .eq('type', type)
          .order('date', { ascending: false });
        
        if (data) setAttendances(data);
      } 
      else if (activeTab === 'discipline') {
        const { data } = await supabase
          .from('discipline')
          .select(`
            *,
            profiles:student_id (username)
          `)
          .eq('class_id', selectedClass)
          .order('date', { ascending: false });
        
        if (data) setDisciplines(data);
      }
    } catch (error) {
      console.error('Error loading records:', error);
      setMessage({ type: 'error', text: 'Failed to load records' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newResult.student_id || !newResult.subject_id || !newResult.test_name) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('results')
        .insert([{
          student_id: newResult.student_id,
          subject_id: newResult.subject_id,
          class_id: selectedClass,
          grade: newResult.grade,
          marks: parseInt(newResult.marks) || 0,
          total_marks: parseInt(newResult.total_marks) || 100,
          test_date: newResult.test_date,
          test_name: newResult.test_name
        }])
        .select(`
          *,
          profiles:student_id (username),
          subjects(name)
        `)
        .single();

      if (error) throw error;
      
      if (data) {
        setResults([data, ...results]);
        setNewResult({
          student_id: '',
          subject_id: '',
          grade: '',
          marks: '',
          total_marks: '',
          test_date: new Date().toISOString().split('T')[0],
          test_name: ''
        });
        setMessage({ type: 'success', text: 'Result added successfully' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleAttendanceChange = async (studentId: string, status: 'present' | 'absent' | 'leave') => {
    if (!selectedClass || !currentDate) return;
    
    const type = activeTab === 'schoolAttendance' ? 'school' : 'online';
    
    try {
      // Check if attendance record already exists
      const { data: existingData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', selectedClass)
        .eq('date', currentDate)
        .eq('type', type)
        .single();
      
      let data;
      
      if (existingData) {
        // Update existing record
        const { data: updatedData, error } = await supabase
          .from('attendance')
          .update({ status })
          .eq('id', existingData.id)
          .select(`
            *,
            profiles:student_id (username)
          `)
          .single();
        
        if (error) throw error;
        data = updatedData;
      } else {
        // Create new record
        const { data: newData, error } = await supabase
          .from('attendance')
          .insert([{
            student_id: studentId,
            class_id: selectedClass,
            date: currentDate,
            status,
            type
          }])
          .select(`
            *,
            profiles:student_id (username)
          `)
          .single();
        
        if (error) throw error;
        data = newData;
      }
      
      if (data) {
        // Update the attendance list
        const updatedAttendances = attendances.filter(a => 
          !(a.student_id === studentId && a.date === currentDate && a.type === type)
        );
        setAttendances([data, ...updatedAttendances]);
        setMessage({ type: 'success', text: 'Attendance updated' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleAddDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newDiscipline.student_id || !newDiscipline.reason) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('discipline')
        .insert([{
          student_id: newDiscipline.student_id,
          class_id: selectedClass,
          warning_count: parseInt(newDiscipline.warning_count) || 1,
          reason: newDiscipline.reason,
          date: newDiscipline.date
        }])
        .select(`
          *,
          profiles:student_id (username)
        `)
        .single();

      if (error) throw error;
      
      if (data) {
        setDisciplines([data, ...disciplines]);
        setNewDiscipline({
          student_id: '',
          warning_count: '1',
          reason: '',
          date: new Date().toISOString().split('T')[0]
        });
        setMessage({ type: 'success', text: 'Discipline record added successfully' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Student view component
  const StudentResultsView = () => (
    <div className="bg-theme-secondary shadow-lg rounded-xl overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-theme-border-primary">
        <h3 className="text-lg leading-6 font-medium text-theme-text-primary">Your Results</h3>
      </div>
      <div className="border-t border-theme-border-primary">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-theme-border-primary">
            <thead className="bg-theme-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider rounded-tl-lg">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                  Test
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider rounded-tr-lg">
                  Marks
                </th>
              </tr>
            </thead>
            <tbody className="bg-theme-secondary divide-y divide-theme-border-primary">
              {results.length > 0 ? (
                results.map((result) => (
                  <tr key={result.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.subjects?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.test_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(result.test_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.marks}/{result.total_marks}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const StudentAttendanceView = () => {
    const type = activeTab === 'schoolAttendance' ? 'school' : 'online';
    const filteredAttendances = attendances.filter(a => a.type === type);
    
    return (
      <div className="bg-theme-secondary shadow-lg rounded-xl overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-theme-border-primary">
          <h3 className="text-lg leading-6 font-medium text-theme-text-primary">
            {activeTab === 'schoolAttendance' ? 'School Attendance' : 'Online Course Attendance'}
          </h3>
        </div>
        <div className="border-t border-theme-border-primary">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme-border-primary">
              <thead className="bg-theme-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider rounded-tl-lg">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-theme-secondary divide-y divide-theme-border-primary">
                {filteredAttendances.length > 0 ? (
                  filteredAttendances.map((attendance) => (
                    <tr key={attendance.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(attendance.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          attendance.status === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : attendance.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const StudentDisciplineView = () => (
    <div className="bg-theme-secondary shadow-lg rounded-xl overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-theme-border-primary">
        <h3 className="text-lg leading-6 font-medium text-theme-text-primary">Discipline Records</h3>
      </div>
      <div className="border-t border-theme-border-primary">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-theme-border-primary">
            <thead className="bg-theme-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider rounded-tl-lg">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                  Warning Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="bg-theme-secondary divide-y divide-theme-border-primary">
              {disciplines.length > 0 ? (
                disciplines.map((discipline) => (
                  <tr key={discipline.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(discipline.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        discipline.warning_count >= 3
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          : discipline.warning_count === 2
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      }`}>
                        {discipline.warning_count === 3 
                          ? 'B Grade' 
                          : discipline.warning_count === 2 
                          ? 'A Grade' 
                          : 'Tardy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {discipline.reason}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-theme-text-secondary">
                    No discipline records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Admin view components
  const AdminResultsView = () => (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Results</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage and track student academic performance</p>
        </div>
        <button
          onClick={() => document.getElementById('addResultForm')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Result
        </button>
      </div>

      {/* Results Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Student
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Test
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Marks
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Grade
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {results.length > 0 ? (
                results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          {result.profiles?.photo_url ? (
                            <img src={result.profiles.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400">
                              <UserCheck className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {result.profiles?.username || 'Unknown Student'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {result.subjects?.name || 'Unknown Subject'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {result.test_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{result.marks}</span>
                      <span className="text-gray-500 dark:text-gray-400"> / {result.total_marks}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        result.grade === 'A+' || result.grade === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                        result.grade === 'B+' || result.grade === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                        result.grade === 'C+' || result.grade === 'C' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                      }`}>
                        {result.grade}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(result.test_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                      <p>No results found. Add a new result below.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Result Form */}
      <div id="addResultForm" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add New Result</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter the student's test results</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="student" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Student
              </label>
              <select
                id="student"
                value={newResult.student_id}
              onChange={(e) => setNewResult(prev => ({ ...prev, student_id: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
              <option value="">Select Student</option>
              {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <select
                id="subject"
                value={newResult.subject_id}
              onChange={(e) => setNewResult(prev => ({ ...prev, subject_id: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
          </div>
          
            <div>
            <label htmlFor="testName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Test Name
              </label>
              <input
                type="text"
              id="testName"
                value={newResult.test_name}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                setNewResult(prev => ({ ...prev, test_name: e.target.value }));
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Midterm, Final, Quiz, etc."
              />
            </div>

            <div>
            <label htmlFor="marks" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Marks Obtained
              </label>
              <input
              type="text"
              id="marks"
              value={newResult.marks}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                const value = e.target.value;
                if (value === '' || /^\d*$/.test(value)) {
                  setNewResult(prev => ({ ...prev, marks: value }));
                }
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="85"
              />
            </div>

            <div>
            <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Marks
              </label>
              <input
              type="text"
              id="totalMarks"
              value={newResult.total_marks}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                const value = e.target.value;
                if (value === '' || /^\d*$/.test(value)) {
                  setNewResult(prev => ({ ...prev, total_marks: value }));
                }
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="100"
            />
          </div>
          
            <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Grade
              </label>
            <select
              id="grade"
              value={newResult.grade}
              onChange={(e) => setNewResult(prev => ({ ...prev, grade: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="">Select Grade</option>
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="B+">B+</option>
              <option value="B">B</option>
              <option value="C+">C+</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="F">F</option>
            </select>
            </div>

            <div>
            <label htmlFor="testDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Test Date
              </label>
              <input
              type="date"
              id="testDate"
              value={newResult.test_date}
              onChange={(e) => setNewResult(prev => ({ ...prev, test_date: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddResult}
              disabled={!newResult.student_id || !newResult.subject_id || !newResult.test_name || !newResult.marks || !newResult.total_marks || !newResult.grade}
              className="inline-flex w-full justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Result
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AdminAttendanceView = () => {
    const type = activeTab === 'schoolAttendance' ? 'school' : 'online';
    
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'schoolAttendance' ? 'School Attendance' : 'Online Course Attendance'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {activeTab === 'schoolAttendance' 
                ? 'Track student attendance in physical classes' 
                : 'Monitor student participation in online courses'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          </div>
          
        {/* Attendance Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {students.length > 0 ? (
                  students.map((student) => {
                    const attendance = attendances.find(a => 
                      a.student_id === student.id && 
                      a.date === currentDate &&
                      a.type === type
                    );
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                              {student.photo_url ? (
                                <img src={student.photo_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400">
                                  <UserCheck className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                          {student.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {attendance ? (
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              attendance.status === 'present' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                                : attendance.status === 'absent'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                            }`}>
                              {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Not marked</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'present')}
                              className={`rounded-lg p-2 transition-colors ${
                                attendance?.status === 'present' 
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-green-900/30 dark:hover:text-green-400'
                              }`}
                              title="Present"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'absent')}
                              className={`rounded-lg p-2 transition-colors ${
                                attendance?.status === 'absent' 
                                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                              }`}
                              title="Absent"
                            >
                              <X className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'leave')}
                              className={`rounded-lg p-2 transition-colors ${
                                attendance?.status === 'leave' 
                                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-400'
                              }`}
                              title="Leave"
                            >
                              <Calendar className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                        <p>No students found in this class</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const AdminDisciplineView = () => (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Discipline Records</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track and manage student discipline</p>
        </div>
        <button
          onClick={() => document.getElementById('addDisciplineForm')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Record
        </button>
      </div>

      {/* Discipline Records Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Student
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Warnings
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Reason
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {disciplines.length > 0 ? (
                disciplines.map((discipline) => (
                  <tr key={discipline.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          {discipline.profiles?.photo_url ? (
                            <img src={discipline.profiles.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400">
                              <UserCheck className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {discipline.profiles?.username || 'Unknown Student'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        discipline.warning_count >= 3
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          : discipline.warning_count === 2
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      }`}>
                        {discipline.warning_count === 3 
                          ? 'B Grade' 
                          : discipline.warning_count === 2 
                          ? 'A Grade' 
                          : 'Tardy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {discipline.reason}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(discipline.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertTriangle className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                      <p>No discipline records found. Add a new record below.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Discipline Form */}
      <div id="addDisciplineForm" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add New Discipline Record</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Record student discipline incidents</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="disciplineStudent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Student
              </label>
              <select
              id="disciplineStudent"
                value={newDiscipline.student_id}
              onChange={(e) => setNewDiscipline(prev => ({ ...prev, student_id: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
              <option value="">Select Student</option>
              {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
            <label htmlFor="warningCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Warning Count
              </label>
            <select
              id="warningCount"
              value={newDiscipline.warning_count}
              onChange={(e) => setNewDiscipline(prev => ({ ...prev, warning_count: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="1">1 - Tardy</option>
              <option value="2">2 - A Grade</option>
              <option value="3">3 - B Grade</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={newDiscipline.date}
              onChange={(e) => setNewDiscipline(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason
            </label>
            <textarea
              id="reason"
              value={newDiscipline.reason}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                setNewDiscipline(prev => ({ ...prev, reason: e.target.value }));
              }}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Describe the incident..."
            />
          </div>
          
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddDiscipline}
              disabled={!newDiscipline.student_id || !newDiscipline.reason.trim()}
              className="inline-flex w-full justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Discipline Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-red-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Record Room</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Manage student records, attendance, and academic performance
          </p>
        </div>
      
      {message && (
          <div className={`mb-3 sm:mb-4 rounded-lg p-3 sm:p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
              : 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-200'
          }`}>
            <p className="flex items-center text-sm sm:text-base">
              {message.type === 'success' ? <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> : <AlertTriangle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
          {message.text}
            </p>
        </div>
      )}

        <div className="mb-4 sm:mb-6 flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto rounded-lg bg-white p-1 shadow-sm dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('results')}
              className={`flex items-center rounded-md px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'results'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
              <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Results
          </button>
          <button
            onClick={() => setActiveTab('schoolAttendance')}
              className={`flex items-center rounded-md px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'schoolAttendance'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
              <UserCheck className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              School
          </button>
          <button
            onClick={() => setActiveTab('onlineAttendance')}
              className={`flex items-center rounded-md px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'onlineAttendance'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
              <Video className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Online
          </button>
          <button
            onClick={() => setActiveTab('discipline')}
              className={`flex items-center rounded-md px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'discipline'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
              <AlertTriangle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Discipline
          </button>
      </div>

          {isAdmin && (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative w-full sm:w-auto">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full sm:w-auto appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-10 py-1.5 sm:py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="">Select class</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      Grade {classItem.grade} - Section {classItem.section}
                  </option>
                ))}
              </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-gray-400" />
            </div>

              {activeTab === 'schoolAttendance' || activeTab === 'onlineAttendance' ? (
                <div className="relative w-full sm:w-auto">
                  <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-1.5 sm:py-2 text-sm text-gray-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-gray-400" />
                </div>
              ) : null}
            </div>
          )}
          </div>

        <div className="rounded-xl bg-white p-3 sm:p-6 shadow-sm dark:bg-gray-800">
          {!isAdmin ? (
            <>
              {/* Student views */}
              {activeTab === 'results' && <StudentResultsView />}
              {activeTab === 'schoolAttendance' && <StudentAttendanceView />}
              {activeTab === 'onlineAttendance' && <StudentAttendanceView />}
              {activeTab === 'discipline' && <StudentDisciplineView />}
            </>
          ) : (
            <>
              {/* Admin views */}
              {!selectedClass ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GraduationCap className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Class Selected</h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">Please select a class to view and manage records</p>
        </div>
      ) : (
        <>
                  {activeTab === 'results' && <AdminResultsView />}
                  {activeTab === 'schoolAttendance' && <AdminAttendanceView />}
                  {activeTab === 'onlineAttendance' && <AdminAttendanceView />}
                  {activeTab === 'discipline' && <AdminDisciplineView />}
                </>
              )}
        </>
      )}
        </div>
      </div>
    </div>
  );
}