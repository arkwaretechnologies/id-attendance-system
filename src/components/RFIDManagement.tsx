'use client';

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'
import type { StudentProfile } from '@/types/database'
import { Search, Tag, Users, AlertCircle, CheckCircle, X, Edit3, Trash2, Plus } from 'lucide-react'

const RFIDManagement = () => {
  const { schoolId } = useAuth()
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    schoolYear: '',
    gradeLevel: ''
  })
  const [schoolYears, setSchoolYears] = useState<string[]>([])
  const [gradeLevels, setGradeLevels] = useState<string[]>([])
  
  // RFID Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null)
  const [newRfId, setNewRfId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [schoolId])

  useEffect(() => {
    loadStudents()
  }, [schoolId, searchTerm, filters])

  const loadInitialData = async () => {
    try {
      const res = await fetch('/api/students/filters', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load filters')
      setSchoolYears(Array.isArray(data.schoolYears) ? data.schoolYears : [])
      setGradeLevels(Array.isArray(data.gradeLevels) ? data.gradeLevels : [])
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (searchTerm.trim()) params.set('search', searchTerm.trim())
      if (filters.schoolYear) params.set('schoolYear', filters.schoolYear)
      if (filters.gradeLevel) params.set('gradeLevel', filters.gradeLevel)
      const res = await fetch(`/api/students/rfid-search?${params.toString()}`, { credentials: 'include' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Failed to load students')
      const list = (result.students ?? []) as StudentProfile[]
      setStudents(list)
      setFilteredStudents(list)
    } catch (err) {
      setError('Failed to load students: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({
      schoolYear: '',
      gradeLevel: ''
    })
  }

  const openAssignModal = (student: StudentProfile) => {
    setSelectedStudent(student)
    setNewRfId(student.rfid_tag || '')
    setShowAssignModal(true)
  }

  const closeAssignModal = () => {
    setShowAssignModal(false)
    setSelectedStudent(null)
    setNewRfId('')
    setAssignLoading(false)
  }

  const handleAssignRfId = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const student = selectedStudent
    if (!student || !newRfId.trim()) return

    try {
      setAssignLoading(true)
      setError('')
      setSuccess('')

      // Check if RFID is already assigned to another student
      if (newRfId.trim() !== student.rfid_tag) {
        const checkRes = await fetch(
          `/api/students/check-rfid?rfid=${encodeURIComponent(newRfId.trim())}`,
          { credentials: 'include' }
        )
        const checkData = await checkRes.json()
        const existing = checkData.student as { id: string; first_name?: string; last_name?: string } | null
        if (existing && existing.id !== student.id) {
          throw new Error(`RFID ${newRfId} is already assigned to ${existing.first_name ?? ''} ${existing.last_name ?? ''}`)
        }
      }

      const patchRes = await fetch(`/api/students/${student.id}/rfid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rfid_tag: newRfId.trim() }),
      })
      const patchData = await patchRes.json()
      if (!patchRes.ok) throw new Error(patchData.error ?? 'Failed to update RFID')

      setSuccess(`RFID successfully ${student.rfid_tag ? 'updated' : 'assigned'} for ${student.first_name} ${student.last_name}`)
      closeAssignModal()
      loadStudents() // Refresh the list
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAssignLoading(false)
    }
  }

  const handleRemoveRfId = async (student: StudentProfile) => {
    if (!confirm(`Are you sure you want to remove the RFID tag from ${student.first_name} ${student.last_name}?`)) {
      return
    }

    try {
      setError('')
      setSuccess('')
      const res = await fetch(`/api/students/${student.id}/rfid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rfid_tag: null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to remove RFID')

      setSuccess(`RFID tag removed from ${student.first_name} ${student.last_name}`)
      loadStudents() // Refresh the list
    } catch (err) {
      setError('Failed to remove RFID: ' + (err as Error).message)
    }
  }

  const getRfIdStatus = (student: StudentProfile) => {
    if (student.rfid_tag) {
      return {
        status: 'assigned',
        className: 'text-green-500',
        icon: CheckCircle,
        text: 'Assigned'
      }
    } else {
      return {
        status: 'unassigned',
        className: 'text-amber-500',
        icon: AlertCircle,
        text: 'Not Assigned'
      }
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading students..." />
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          RFID Management
        </h1>
        <p className="text-lg text-primary-600 dark:text-gray-400">
          Assign and manage RFID tags for students
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success mb-6">
          <CheckCircle size={20} className="mr-2" />
          {success}
        </div>
      )}
      
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="card mb-6" style={{backgroundColor: 'var(--color-bg-primary)'}}>
        <h2 className="text-xl font-bold text-primary-700 dark:text-gray-200 mb-5 flex items-center">
          <Search size={20} className="mr-2" />
          Search Students
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name or LRN"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">School Year</label>
            <select
              name="schoolYear"
              className="form-input"
              value={filters.schoolYear}
              onChange={handleFilterChange}
            >
              <option value="">All School Years</option>
              {schoolYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Grade Level</label>
            <select
              name="gradeLevel"
              className="form-input"
              value={filters.gradeLevel}
              onChange={handleFilterChange}
            >
              <option value="">All Grade Levels</option>
              {gradeLevels.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group flex items-end">
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-primary-700 dark:text-gray-200 flex items-center">
            <Users size={20} className="mr-2" />
            Students ({filteredStudents.length})
          </h2>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-10 text-gray-700 dark:text-gray-300">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No students found</p>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="p-3 text-left font-semibold text-gray-800 dark:text-gray-200">LRN</th>
                  <th className="p-3 text-left font-semibold text-gray-800 dark:text-gray-200">Student Name</th>
                  <th className="p-3 text-left font-semibold text-gray-800 dark:text-gray-200 hide-mobile">Grade Level</th>
                  <th className="p-3 text-left font-semibold text-gray-800 dark:text-gray-200 hide-mobile">School Year</th>
                  <th className="p-3 text-left font-semibold text-gray-800 dark:text-gray-200">RFID Status</th>
                  <th className="p-3 text-left font-semibold text-gray-800 dark:text-gray-200">RFID Tag</th>
                  <th className="p-3 text-left font-semibold text-gray-800 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const rfidStatus = getRfIdStatus(student)
                  const StatusIcon = rfidStatus.icon
                  
                  return (
                    <tr key={student.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">
                        {/* <span className="font-mono text-sm text-primary-800 dark:text-gray-200"> */}
                          {student.learner_reference_number || 'N/A'}
                        {/* </span> */}
                      </td>
                      <td className="p-3">
                        {/* <div className="font-medium text-primary-700 dark:text-gray-100"> */}
                          {student.last_name}, {student.first_name} {student.middle_name} {student.extension_name}
                        {/* </div> */}
                      </td>
                      <td className="p-3 hide-mobile text-gray-800 dark:text-gray-200">
                        {student.grade_level || 'N/A'}
                      </td>
                      <td className="p-3 hide-mobile text-gray-800 dark:text-gray-200">
                        {student.school_year || 'N/A'}
                      </td>
                      <td className="p-3">
                        <div className={`flex items-center ${rfidStatus.className}`}>
                          <StatusIcon size={16} className="mr-1.5" />
                          <span className="font-medium">{rfidStatus.text}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {student.rfid_tag ? (
                          <span className="font-mono text-sm  dark:text-white bg-teal-100 dark:bg-teal-700 px-2 py-1 rounded">
                            {student.rfid_tag}
                          </span>
                        ) : (
                          <span className="text-red-900 dark:text-gray-400 italic">Not assigned</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openAssignModal(student)}
                            title={student.rfid_tag ? 'Update RFID' : 'Assign RFID'}
                          >
                            {student.rfid_tag ? <Edit3 size={14} /> : <Plus size={14} />}
                          </button>
                          {student.rfid_tag && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveRfId(student)}
                              title="Remove RFID"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RFID Assignment Modal */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeAssignModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                  <Tag size={20} className="mr-2" />
                  {selectedStudent.rfid_tag ? 'Update' : 'Assign'} RFID Tag
                </h3>
                <button onClick={closeAssignModal} className="text-gray-500 hover:text-primary-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X size={24} />
                </button>
              </div>
            
            <div>
              <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Student Information</h4>
                <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Name:</strong> {selectedStudent.first_name} {selectedStudent.middle_name} {selectedStudent.last_name} {selectedStudent.extension_name}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200"><strong>LRN:</strong> {selectedStudent.learner_reference_number || 'N/A'}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Grade:</strong> {selectedStudent.grade_level || 'N/A'}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200"><strong>School Year:</strong> {selectedStudent.school_year || 'N/A'}</p>
                {selectedStudent.rfid_tag && (
                  <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Current RFID:</strong> <span className="font-mono">{selectedStudent.rfid_tag}</span></p>
                )}
              </div>
              
              <form onSubmit={handleAssignRfId}>
                <div className="form-group">
                  <label className="form-label">RFID Tag</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    value={newRfId}
                    onChange={(e) => setNewRfId(e.target.value)}
                    placeholder="Enter RFID tag (e.g., 1234567890)"
                    required
                    disabled={assignLoading}
                  />
                  <p className="form-help">Enter the RFID tag number to assign to this student</p>
                </div>
                
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeAssignModal}
                    disabled={assignLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={assignLoading || !newRfId.trim()}
                  >
                    {assignLoading ? 'Saving...' : (selectedStudent.rfid_tag ? 'Update RFID' : 'Assign RFID')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RFIDManagement