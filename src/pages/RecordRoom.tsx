import React, { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
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
  const { user } = useSession();
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

  // Hidden search boxes for form submission
  const [hiddenSearchBoxes, setHiddenSearchBoxes] = useState({
    testName: '',
    marks: '',
    totalMarks: '',
    reason: ''
  });

  // New discipline form
  const [newDiscipline, setNewDiscipline] = useState({
    student_id: '',
    warning_count: '1',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'admin' || user?.role === 'teacher';

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
  }, [selectedClass, isAdmin]);

  // Reload records when activeTab changes
  useEffect(() => {
    if (selectedClass && isAdmin) {
      loadRecords();
    }
  }, [activeTab, selectedClass, isAdmin]);

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
      console.log('Loading records for:', { activeTab, selectedClass });
      
      if (activeTab === 'results') {
        const { data, error } = await supabase
          .from('results')
          .select(`
            *,
            profiles:student_id (username),
            subjects(name)
          `)
          .eq('class_id', selectedClass)
          .order('test_date', { ascending: false });
        
        if (error) throw error;
        console.log('Loaded results:', data?.length || 0);
        if (data) setResults(data);
      } 
      else if (activeTab === 'schoolAttendance') {
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            *,
            profiles:student_id (username)
          `)
          .eq('class_id', selectedClass)
          .eq('type', 'school')
          .order('date', { ascending: false });
        
        if (error) throw error;
        console.log('Loaded attendance:', data?.length || 0);
        if (data) setAttendances(data);
      } 
      else if (activeTab === 'discipline') {
        const { data, error } = await supabase
          .from('discipline')
          .select(`
            *,
            profiles:student_id (username)
          `)
          .eq('class_id', selectedClass)
          .order('date', { ascending: false });
        
        if (error) throw error;
        console.log('Loaded discipline:', data?.length || 0);
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
        
        // Reload records after a short delay to ensure data persistence
        setTimeout(() => {
          if (selectedClass && isAdmin) {
            loadRecords();
          }
        }, 1000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleAttendanceChange = async (studentId: string, status: 'present' | 'absent' | 'leave') => {
    if (!selectedClass || !currentDate) return;
    
    const type = 'school';
    
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
        // Update the attendance list by replacing the existing record or adding new one
        const existingIndex = attendances.findIndex(a => 
          a.student_id === studentId && a.date === currentDate && a.type === type
        );
        
        if (existingIndex !== -1) {
          // Update existing record
          const updatedAttendances = [...attendances];
          updatedAttendances[existingIndex] = data;
          setAttendances(updatedAttendances);
        } else {
          // Add new record
          setAttendances([data, ...attendances]);
        }
        setMessage({ type: 'success', text: 'Attendance updated' });
        
        // Reload records after a short delay to ensure data persistence
        setTimeout(() => {
          if (selectedClass && isAdmin) {
            loadRecords();
          }
        }, 1000);
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
        
        // Reload records after a short delay to ensure data persistence
        setTimeout(() => {
          if (selectedClass && isAdmin) {
            loadRecords();
          }
        }, 1000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Student view component
  const StudentResultsView = () => (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Your Academic Results</h3>
            <p className="text-red-100 mt-1">Track your performance across all subjects</p>
          </div>
          <div className="hidden sm:block">
            <div className="text-right">
              <div className="text-3xl font-bold">{results.length}</div>
              <div className="text-red-100 text-sm">Total Tests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Cards */}
      {results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <div key={result.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg">{result.subjects?.name || 'Unknown Subject'}</h4>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{result.grade}</div>
                    <div className="text-blue-100 text-xs">Grade</div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Test Name</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.test_name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(result.test_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      {result.marks}/{result.total_marks}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round((result.marks / result.total_marks) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(result.marks / result.total_marks) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <FileText className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Results Yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your academic results will appear here once they are added by your teachers.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const StudentAttendanceView = () => {
    const type = 'school';
    const filteredAttendances = attendances.filter(a => a.type === type);
    
    // Calculate attendance statistics
    const totalDays = filteredAttendances.length;
    const presentDays = filteredAttendances.filter(a => a.status === 'present').length;
    const absentDays = filteredAttendances.filter(a => a.status === 'absent').length;
    const leaveDays = filteredAttendances.filter(a => a.status === 'leave').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    return (
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">School Attendance</h3>
              <p className="text-green-100 mt-1">Track your daily attendance record</p>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <div className="text-3xl font-bold">{attendancePercentage}%</div>
                <div className="text-green-100 text-sm">Attendance Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{presentDays}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <X className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{absentDays}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Leave</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{leaveDays}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDays}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        {filteredAttendances.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Attendance</h4>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAttendances.slice(0, 10).map((attendance) => (
                <div key={attendance.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        attendance.status === 'present' 
                          ? 'bg-green-500' 
                          : attendance.status === 'absent'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(attendance.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(attendance.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      attendance.status === 'present' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                        : attendance.status === 'absent'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    }`}>
                      {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <UserCheck className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Attendance Records</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your attendance records will appear here once they are marked by your teachers.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const StudentDisciplineView = () => (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Discipline Records</h3>
            <p className="text-orange-100 mt-1">Track your behavioral records and warnings</p>
          </div>
          <div className="hidden sm:block">
            <div className="text-right">
              <div className="text-3xl font-bold">{disciplines.length}</div>
              <div className="text-orange-100 text-sm">Total Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* Discipline Records */}
      {disciplines.length > 0 ? (
        <div className="space-y-4">
          {disciplines.map((discipline) => (
            <div key={discipline.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Card Header */}
              <div className={`px-6 py-4 ${
                discipline.warning_count >= 3
                  ? 'bg-red-500 text-white'
                  : discipline.warning_count === 2
                  ? 'bg-yellow-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <h4 className="font-semibold">
                        {discipline.warning_count === 3 
                          ? 'Serious Warning' 
                          : discipline.warning_count === 2 
                          ? 'Moderate Warning' 
                          : 'Minor Warning'}
                      </h4>
                      <p className="text-sm opacity-90">
                        {new Date(discipline.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{discipline.warning_count}</div>
                    <div className="text-xs opacity-90">Warnings</div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Reason</h5>
                    <p className="text-gray-900 dark:text-white leading-relaxed">
                      {discipline.reason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        discipline.warning_count >= 3
                          ? 'bg-red-500'
                          : discipline.warning_count === 2
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}></div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(discipline.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Discipline Records</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Great job! You have no discipline records. Keep up the good behavior.
            </p>
          </div>
        </div>
      )}
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
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Actions
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
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this result?')) {
                            const { error } = await supabase
                              .from('results')
                              .delete()
                              .eq('id', result.id);
                            if (error) {
                              alert('Failed to delete result: ' + error.message);
                            } else {
                              setResults(results.filter(r => r.id !== result.id));
                            }
                          }
                        }}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
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
              <div className="flex gap-2">
                <input
                  type="text"
                  id="testName"
                  value={newResult.test_name}
                  onChange={(e) => {
                    setNewResult(prev => ({ ...prev, test_name: e.target.value }));
                    setHiddenSearchBoxes(prev => ({ ...prev, testName: e.target.value }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Midterm, Final, Quiz, etc."
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setNewResult(prev => ({ ...prev, test_name: text }));
                      setHiddenSearchBoxes(prev => ({ ...prev, testName: text }));
                    } catch (err) {
                      console.error('Failed to read clipboard:', err);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Paste
                </button>
              </div>
            </div>

            <div>
            <label htmlFor="marks" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Marks Obtained
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="marks"
                  value={newResult.marks}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*$/.test(value)) {
                      setNewResult(prev => ({ ...prev, marks: value }));
                      setHiddenSearchBoxes(prev => ({ ...prev, marks: value }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="85"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text === '' || /^\d*$/.test(text)) {
                        setNewResult(prev => ({ ...prev, marks: text }));
                        setHiddenSearchBoxes(prev => ({ ...prev, marks: text }));
                      }
                    } catch (err) {
                      console.error('Failed to read clipboard:', err);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Paste
                </button>
              </div>
            </div>

            <div>
            <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Marks
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="totalMarks"
                  value={newResult.total_marks}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*$/.test(value)) {
                      setNewResult(prev => ({ ...prev, total_marks: value }));
                      setHiddenSearchBoxes(prev => ({ ...prev, totalMarks: value }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="100"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text === '' || /^\d*$/.test(text)) {
                        setNewResult(prev => ({ ...prev, total_marks: text }));
                        setHiddenSearchBoxes(prev => ({ ...prev, totalMarks: text }));
                      }
                    } catch (err) {
                      console.error('Failed to read clipboard:', err);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Paste
                </button>
              </div>
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
    const type = 'school';
    
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              School Attendance
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track student attendance in physical classes
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
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this discipline record?')) {
                            const { error } = await supabase
                              .from('discipline')
                              .delete()
                              .eq('id', discipline.id);
                            if (error) {
                              alert('Failed to delete discipline record: ' + error.message);
                            } else {
                              setDisciplines(disciplines.filter(d => d.id !== discipline.id));
                            }
                          }
                        }}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
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
            <div className="flex gap-2">
              <textarea
                id="reason"
                value={newDiscipline.reason}
                onChange={(e) => {
                  setNewDiscipline(prev => ({ ...prev, reason: e.target.value }));
                  setHiddenSearchBoxes(prev => ({ ...prev, reason: e.target.value }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                rows={3}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Describe the incident..."
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setNewDiscipline(prev => ({ ...prev, reason: text }));
                    setHiddenSearchBoxes(prev => ({ ...prev, reason: text }));
                  } catch (err) {
                    console.error('Failed to read clipboard:', err);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 self-start"
              >
                Paste
              </button>
            </div>
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

              {activeTab === 'schoolAttendance' ? (
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