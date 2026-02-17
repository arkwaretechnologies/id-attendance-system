'use client';

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'
import StudentEnrollment from './StudentEnrollment'
import type { StudentProfile } from '@/types/database'
import { Users, Plus, Filter, ChevronLeft, ChevronRight, User, Pencil, Trash2, X } from 'lucide-react'

const StudentManagement = () => {
  const router = useRouter()
  const { schoolId } = useAuth()
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)

  // Edit modal state
  const [editStudentId, setEditStudentId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<StudentProfile>>({})
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string | null>(null)
  
  // Filter states
  const [filters, setFilters] = useState({
    schoolYear: '',
    gradeLevel: ''
  })
  const [schoolYears, setSchoolYears] = useState<string[]>([])
  const [gradeLevels, setGradeLevels] = useState<string[]>([])
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    loadFilterOptions()
  }, [schoolId])

  useEffect(() => {
    loadStudents()
  }, [schoolId, filters, currentPage, pageSize])

  const loadFilterOptions = async () => {
    try {
      const res = await fetch('/api/students/filters', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load filters')

      setSchoolYears(Array.isArray(data.schoolYears) ? data.schoolYears : [])
      setGradeLevels(Array.isArray(data.gradeLevels) ? data.gradeLevels : [])
    } catch (err) {
      console.error('Failed to load filter options:', err)
    }
  }

  const loadStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.schoolYear) params.set('schoolYear', filters.schoolYear)
      if (filters.gradeLevel) params.set('gradeLevel', filters.gradeLevel)
      params.set('page', String(currentPage))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/students?${params.toString()}`, { credentials: 'include' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Failed to load students')
      
      setStudents((result.students ?? []) as StudentProfile[])
      setTotalCount(result.count ?? 0)
      setTotalPages(Math.ceil((result.count ?? 0) / pageSize))
    } catch (err) {
      setError('Failed to load students')
      console.error('Load students error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1) // Reset to first page when page size changes
  }

  const clearFilters = () => {
    setFilters({
      schoolYear: '',
      gradeLevel: ''
    })
    setCurrentPage(1)
  }

  const openEditModal = async (id: string) => {
    setEditStudentId(id)
    setEditLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/students/${id}`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load student')
      setEditForm((data.student ?? {}) as Partial<StudentProfile>)
    } catch (err) {
      setError((err as Error).message)
      setEditStudentId(null)
    } finally {
      setEditLoading(false)
    }
  }

  const closeEditModal = () => {
    setEditStudentId(null)
    setEditForm({})
    setEditSaving(false)
    setEditImageFile(null)
    if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl)
    setEditImagePreviewUrl(null)
  }

  const handleEditFormChange = (field: keyof StudentProfile, value: string | number | null) => {
    setEditForm(prev => ({ ...prev, [field]: value ?? '' }))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editStudentId) return
    setEditSaving(true)
    setError('')
    try {
      let payload = { ...editForm }
      if (editImageFile) {
        const form = new FormData()
        form.append('image', editImageFile)
        const uploadRes = await fetch('/api/students/upload-image', {
          method: 'POST',
          credentials: 'include',
          body: form,
        })
        const uploadJson = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadJson.error ?? 'Failed to upload image')
        payload = { ...payload, student_image_url: uploadJson.url ?? null }
      }
      const res = await fetch(`/api/students/${editStudentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update student')
      setSuccess('Student updated successfully.')
      closeEditModal()
      loadStudents()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async (student: StudentProfile) => {
    const name = [student.first_name, student.last_name].filter(Boolean).join(' ') || 'this student'
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return
    setError('')
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete student')
      setSuccess('Student deleted successfully.')
      loadStudents()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return pages
  }

  if (loading && students.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="flex items-center">
          <Users size={32} className="mr-3" />
          Student Management
        </h1>
        <button
          onClick={() => setShowEnrollmentForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Enroll Student
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Student Enrollment Form */}
      {showEnrollmentForm && (
        <StudentEnrollment
          onCancel={() => {
            setShowEnrollmentForm(false)
            setError('')
            setSuccess('')
          }}
          onSuccess={() => {
            setShowEnrollmentForm(false)
            setSuccess('Student enrolled successfully!')
            loadStudents()
          }}
        />
      )}

      {/* Edit Student Modal */}
      {editStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !editSaving && closeEditModal()}>
          <div className="edit-student-modal bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Student</h2>
              <button type="button" onClick={closeEditModal} className="p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600">
                <X size={20} />
              </button>
            </div>
            {editLoading ? (
              <div className="p-10 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="edit-student-modal-form p-6 space-y-4">
                {/* Student Photo */}
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <label className="form-label text-gray-800 dark:text-gray-200 block mb-2">Student Photo</label>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                      {editImagePreviewUrl ? (
                        <img src={editImagePreviewUrl} alt="New" className="w-full h-full object-cover" />
                      ) : editForm.student_image_url ? (
                        <img src={editForm.student_image_url} alt="Current" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="block w-full text-sm text-gray-800 dark:text-gray-200"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) {
                            setEditImageFile(f)
                            setEditImagePreviewUrl(URL.createObjectURL(f))
                          } else {
                            setEditImageFile(null)
                            if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl)
                            setEditImagePreviewUrl(null)
                          }
                        }}
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">JPEG, PNG, GIF or WebP. Max 5MB.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">LRN</label>
                    <input
                      type="text"
                      className="form-input edit-modal-input"
                      value={editForm.learner_reference_number ?? ''}
                      onChange={e => handleEditFormChange('learner_reference_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">RFID Tag</label>
                    <input
                      type="text"
                      className="form-input edit-modal-input"
                      value={editForm.rfid_tag ?? ''}
                      onChange={e => handleEditFormChange('rfid_tag', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">Last Name *</label>
                    <input
                      type="text"
                      className="form-input edit-modal-input"
                      value={editForm.last_name ?? ''}
                      onChange={e => handleEditFormChange('last_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">First Name *</label>
                    <input
                      type="text"
                      className="form-input edit-modal-input"
                      value={editForm.first_name ?? ''}
                      onChange={e => handleEditFormChange('first_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">Middle Name</label>
                    <input
                      type="text"
                      className="form-input edit-modal-input"
                      value={editForm.middle_name ?? ''}
                      onChange={e => handleEditFormChange('middle_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">Extension Name</label>
                    <input
                      type="text"
                      className="form-input edit-modal-input"
                      value={editForm.extension_name ?? ''}
                      onChange={e => handleEditFormChange('extension_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">Sex</label>
                    <select
                      className="form-input edit-modal-input"
                      value={editForm.sex ?? ''}
                      onChange={e => handleEditFormChange('sex', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">School Year</label>
                    <input
                      type="text"
                      className="form-input edit-modal-input"
                      value={editForm.school_year ?? ''}
                      onChange={e => handleEditFormChange('school_year', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">Grade Level</label>
                    <input
                      type="text"
                      className="form-input edit-modal-input"
                      value={editForm.grade_level ?? ''}
                      onChange={e => handleEditFormChange('grade_level', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">Email</label>
                    <input
                      type="email"
                      className="form-input edit-modal-input"
                      value={editForm.email_address ?? ''}
                      onChange={e => handleEditFormChange('email_address', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label text-gray-800 dark:text-gray-200">Phone</label>
                    <input
                      type="text"
                      className="form-input edit-modal-input"
                      value={String(editForm.phone_number ?? '')}
                      onChange={e => handleEditFormChange('phone_number', e.target.value)}
                    />
                  </div>
                </div>

                {/* Father Details */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Father</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Father Last Name</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.father_last_name ?? '')}
                        onChange={e => handleEditFormChange('father_last_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Father First Name</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.father_first_name ?? '')}
                        onChange={e => handleEditFormChange('father_first_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Father Middle Name</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.father_middle_name ?? '')}
                        onChange={e => handleEditFormChange('father_middle_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Father Contact Number</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.father_contact_number ?? '')}
                        onChange={e => handleEditFormChange('father_contact_number', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Mother Details */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Mother</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Mother Last Name</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.mother_last_name ?? '')}
                        onChange={e => handleEditFormChange('mother_last_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Mother First Name</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.mother_first_name ?? '')}
                        onChange={e => handleEditFormChange('mother_first_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Mother Middle Name</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.mother_middle_name ?? '')}
                        onChange={e => handleEditFormChange('mother_middle_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Mother Contact Number</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.mother_contact_number ?? '')}
                        onChange={e => handleEditFormChange('mother_contact_number', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian Details */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Guardian</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Guardian Last Name</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.guardian_last_name ?? '')}
                        onChange={e => handleEditFormChange('guardian_last_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Guardian First Name</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.guardian_first_name ?? '')}
                        onChange={e => handleEditFormChange('guardian_first_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Guardian Middle Name</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.guardian_middle_name ?? '')}
                        onChange={e => handleEditFormChange('guardian_middle_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label text-gray-800 dark:text-gray-200">Guardian Contact Number</label>
                      <input
                        type="text"
                        className="form-input edit-modal-input"
                        value={String(editForm.guardian_contact_number ?? '')}
                        onChange={e => handleEditFormChange('guardian_contact_number', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={closeEditModal} className="btn btn-secondary text-gray-800 dark:text-gray-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={editSaving} className="btn btn-primary">
                    {editSaving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={20} />
            <span className="font-semibold text-gray-800 dark:text-gray-100">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="form-label">School Year:</label>
            <select
              value={filters.schoolYear}
              onChange={(e) => handleFilterChange('schoolYear', e.target.value)}
              className="form-input"
            >
              <option value="">All Years</option>
              {schoolYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="form-label">Grade Level:</label>
            <select
              value={filters.gradeLevel}
              onChange={(e) => handleFilterChange('gradeLevel', e.target.value)}
              className="form-input"
            >
              <option value="">All Grades</option>
              {gradeLevels.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          
          {(filters.schoolYear || filters.gradeLevel) && (
            <button
              onClick={clearFilters}
              className="btn btn-secondary text-sm py-2 px-4"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Students ({totalCount})</h2>
          
          <div className="flex items-center gap-2">
            <label className="form-label">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="form-input"
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center p-10">
            <LoadingSpinner />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center p-10 text-gray-500 dark:text-gray-400">
            <User size={48} className="mb-4 opacity-50 mx-auto" />
            <p>No students found.</p>
            {(filters.schoolYear || filters.gradeLevel) ? (
              <p>Try adjusting your filters or <button onClick={clearFilters} className="text-blue-600 underline bg-transparent border-none cursor-pointer">clear all filters</button>.</p>
            ) : (
              <p>Click &quot;Enroll Student&quot; to get started.</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr >
                    <th>LRN No.</th>
                    <th>RFID Tag</th>
                    <th>Last Name</th>
                    <th>First Name</th>
                    <th>Middle Name</th>
                    <th>Extension Name</th>
                    <th>Sex</th>
                    <th>Grade Level</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-300 dark:border-gray-700 odd:bg-gray-100 dark:odd:bg-gray-800/50">
                      <td className="p-3 font-mono text-gray-700 dark:text-gray-200">
                        {student.learner_reference_number || 'N/A'}
                      </td>
                      <td className="p-3 font-mono text-gray-700 dark:text-gray-200">
                        {student.rfid_tag || 'N/A'}
                      </td>
                      <td className="p-3 font-semibold text-gray-800 dark:text-gray-100">
                        {student.last_name || 'N/A'}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-200">
                        {student.first_name || 'N/A'}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-200">
                        {student.middle_name || 'N/A'}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-200">
                        {student.extension_name || 'N/A'}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-200">
                        {student.sex || 'N/A'}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-200">
                        {student.grade_level || 'N/A'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(student.id)}
                            className="p-2 rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(student)}
                            className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:bg-gray-900 dark:disabled:text-gray-500 flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  
                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded-md min-w-[40px] ${pageNum === currentPage 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:bg-gray-900 dark:disabled:text-gray-500 flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default StudentManagement