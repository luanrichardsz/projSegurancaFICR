import { db } from '../config/firebase-admin.ts';

export class StudentService {
  async createStudent(schoolId: string, studentData: any, createdBy: string) {
    const newStudentRef = db.collection('students').doc();
    
    const dataToSave = {
      ...studentData,
      schoolId,
      enrolledAt: new Date().toISOString(),
    };

    await newStudentRef.set(dataToSave);
    
    // Audit Log
    await db.collection('audit_logs').add({
      schoolId,
      userId: createdBy,
      action: 'CREATE_STUDENT',
      resource: newStudentRef.id,
      timestamp: new Date().toISOString()
    });

    return { id: newStudentRef.id, ...dataToSave };
  }

  async getStudentsBySchool(schoolId: string) {
    const snapshot = await db.collection('students').where('schoolId', '==', schoolId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  async getStudentById(studentId: string) {
    const doc = await db.collection('students').doc(studentId).get();
    return { id: doc.id, ...doc.data() };
  }
}

export const studentService = new StudentService();
