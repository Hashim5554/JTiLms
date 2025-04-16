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

interface Class {
  id: string;
  grade: number;
  section: string;
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
  const [classes, setClasses] = useState<Class[]>([]);
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

  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'teacher';

  useEffect(() => {
    if (isAdmin) {
      loadClasses();
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

  const loadClasses = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .order('grade')
        .order('section');
      
      if (data) setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
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
          profiles (
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
          profiles: assignment.profiles.map((profile: any) => ({
            id: profile.id,
            username: profile.username,
            email: profile.email,
            photo_url: profile.photo_url
          }))
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
                      {discipline.warning_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {discipline.reason}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
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
      <div className="bg-theme-secondary shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-medium text-theme-text-primary mb-4">Add New Result</h3>
        <form onSubmit={handleAddResult} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student" className="block text-sm font-medium text-theme-text-secondary">
                Student
              </label>
              <select
                id="student"
                value={newResult.student_id}
                onChange={(e) => setNewResult({...newResult, student_id: e.target.value})}
                className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="">Select a student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-theme-text-secondary">
                Subject
              </label>
              <select
                id="subject"
                value={newResult.subject_id}
                onChange={(e) => setNewResult({...newResult, subject_id: e.target.value})}
                className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="">Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="test-name" className="block text-sm font-medium text-theme-text-secondary">
                Test Name
              </label>
              <input
                type="text"
                id="test-name"
                value={newResult.test_name}
                onChange={(e) => setNewResult({...newResult, test_name: e.target.value})}
                className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="e.g., Mid-Term Exam"
              />
            </div>
            <div>
              <label htmlFor="test-date" className="block text-sm font-medium text-theme-text-secondary">
                Test Date
              </label>
              <input
                type="date"
                id="test-date"
                value={newResult.test_date}
                onChange={(e) => setNewResult({...newResult, test_date: e.target.value})}
                className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-theme-text-secondary">
                Grade
              </label>
              <input
                type="text"
                id="grade"
                value={newResult.grade}
                onChange={(e) => setNewResult({...newResult, grade: e.target.value})}
                className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="e.g., A, B, C"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="marks" className="block text-sm font-medium text-theme-text-secondary">
                Marks
              </label>
              <input
                type="number"
                id="marks"
                value={newResult.marks}
                onChange={(e) => setNewResult({...newResult, marks: e.target.value})}
                className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="e.g., 85"
              />
            </div>
            <div>
              <label htmlFor="total-marks" className="block text-sm font-medium text-theme-text-secondary">
                Total Marks
              </label>
              <input
                type="number"
                id="total-marks"
                value={newResult.total_marks}
                onChange={(e) => setNewResult({...newResult, total_marks: e.target.value})}
                className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="e.g., 100"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Result
            </button>
          </div>
        </form>
      </div>

      <div className="bg-theme-secondary shadow-lg rounded-xl overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-theme-border-primary">
          <h3 className="text-lg leading-6 font-medium text-theme-text-primary">Results</h3>
        </div>
        <div className="border-t border-theme-border-primary">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme-border-primary">
              <thead className="bg-theme-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider rounded-tl-lg">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
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
                        {result.profiles?.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const AdminAttendanceView = () => {
    const type = activeTab === 'schoolAttendance' ? 'school' : 'online';
    
    return (
      <div className="space-y-6">
        <div className="bg-theme-secondary shadow-lg rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h3 className="text-lg font-medium text-theme-text-primary">
              {activeTab === 'schoolAttendance' ? 'School Attendance' : 'Online Course Attendance'}
            </h3>
            <div className="mt-2 md:mt-0 flex items-center">
              <Calendar className="h-5 w-5 text-theme-text-secondary mr-2" />
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme-border-primary">
              <thead className="bg-theme-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider rounded-tl-lg">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-theme-secondary divide-y divide-theme-border-primary">
                {students.length > 0 ? (
                  students.map((student) => {
                    // Find attendance record for this student on the current date
                    const attendance = attendances.find(a => 
                      a.student_id === student.id && 
                      a.date === currentDate &&
                      a.type === type
                    );
                    
                    return (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attendance ? (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              attendance.status === 'present' 
                                ? 'bg-green-100 text-green-800' 
                                : attendance.status === 'absent'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                            </span>
                          ) : (
                            <span className="text-theme-text-secondary">Not marked</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text-secondary">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'present')}
                              className={`p-1 rounded-full ${
                                attendance?.status === 'present' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-theme-tertiary text-theme-text-secondary hover:bg-green-100 hover:text-green-600'
                              }`}
                              title="Present"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'absent')}
                              className={`p-1 rounded-full ${
                                attendance?.status === 'absent' 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'bg-theme-tertiary text-theme-text-secondary hover:bg-red-100 hover:text-red-600'
                              }`}
                              title="Absent"
                            >
                              <X className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'leave')}
                              className={`p-1 rounded-full ${
                                attendance?.status === 'leave' 
                                  ? 'bg-yellow-100 text-yellow-600' 
                                  : 'bg-theme-tertiary text-theme-text-secondary hover:bg-yellow-100 hover:text-yellow-600'
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
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-theme-text-secondary">
                      No students found in this class
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
      <div className="bg-theme-secondary shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-medium text-theme-text-primary mb-4">Add Discipline Record</h3>
        <form onSubmit={handleAddDiscipline} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="discipline-student" className="block text-sm font-medium text-theme-text-secondary">
                Student
              </label>
              <select
                id="discipline-student"
                value={newDiscipline.student_id}
                onChange={(e) => setNewDiscipline({...newDiscipline, student_id: e.target.value})}
                className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="">Select a student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="discipline-date" className="block text-sm font-medium text-theme-text-secondary">
                Date
              </label>
              <input
                type="date"
                id="discipline-date"
                value={newDiscipline.date}
                onChange={(e) => setNewDiscipline({...newDiscipline, date: e.target.value})}
                className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="warning-count" className="block text-sm font-medium text-theme-text-secondary">
              Warning Count
            </label>
            <input
              type="number"
              id="warning-count"
              value={newDiscipline.warning_count}
              onChange={(e) => setNewDiscipline({...newDiscipline, warning_count: e.target.value})}
              min="1"
              className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-theme-text-secondary">
              Reason
            </label>
            <textarea
              id="reason"
              rows={3}
              value={newDiscipline.reason}
              onChange={(e) => setNewDiscipline({...newDiscipline, reason: e.target.value})}
              className="mt-1 block w-full rounded-md border-theme-border-primary shadow-sm focus:border-red-500 focus:ring-red-500"
              placeholder="Describe the reason for the warning"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              Add Warning
            </button>
          </div>
        </form>
      </div>

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
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
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
                        {discipline.profiles?.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(discipline.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {discipline.warning_count}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {discipline.reason}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-theme-text-secondary">
                      No discipline records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-theme-text-primary dark:text-white">Record Room</h1>
      </div>

      {message && (
        <div className={`card mb-4 ${
          message.type === 'error' ? 'bg-red-50 dark:bg-red-900/50' : 'bg-green-50 dark:bg-green-900/50'
        }`}>
          <p className={`${
            message.type === 'error' ? 'text-red-600 dark:text-red-200' : 'text-green-600 dark:text-green-200'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="card mb-8">
        <div className="card-header">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-2xl transition-colors ${
                activeTab === 'results'
                  ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200'
                  : 'text-theme-text-secondary dark:text-gray-400 hover:bg-theme-tertiary dark:hover:bg-gray-700'
              }`}
            >
              <GraduationCap className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveTab('schoolAttendance')}
              className={`px-4 py-2 rounded-2xl transition-colors ${
                activeTab === 'schoolAttendance'
                  ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200'
                  : 'text-theme-text-secondary dark:text-gray-400 hover:bg-theme-tertiary dark:hover:bg-gray-700'
              }`}
            >
              <Calendar className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveTab('discipline')}
              className={`px-4 py-2 rounded-2xl transition-colors ${
                activeTab === 'discipline'
                  ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200'
                  : 'text-theme-text-secondary dark:text-gray-400 hover:bg-theme-tertiary dark:hover:bg-gray-700'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Select Class</h2>
              </div>
              <div className="p-6">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="input-primary w-full"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      Class {cls.grade}-{cls.section}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedClass ? (
              <>
                {activeTab === 'results' && <AdminResultsView />}
                {(activeTab === 'schoolAttendance' || activeTab === 'onlineAttendance') && <AdminAttendanceView />}
                {activeTab === 'discipline' && <AdminDisciplineView />}
              </>
            ) : (
              <div className="card p-6 text-center">
                <p className="text-theme-text-secondary dark:text-gray-400">Please select a class to view records</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'results' && <StudentResultsView />}
            {(activeTab === 'schoolAttendance' || activeTab === 'onlineAttendance') && <StudentAttendanceView />}
            {activeTab === 'discipline' && <StudentDisciplineView />}
          </>
        )}
      </div>
    </div>
  );
}