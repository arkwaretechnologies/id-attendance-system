'use client';

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/supabase'
import LoadingSpinner from './LoadingSpinner'
import StudentEnrollment from './StudentEnrollment'
import type { StudentProfile } from '@/types/database'
import { Users, Plus, Filter, ChevronLeft, ChevronRight, User } from 'lucide-react'

const StudentManagement = () => {
  const router = useRouter()
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState({
    schoolYear: '',
    gradeLevel: ''
  })
  const [schoolYears, setSchoolYears] = useState<string[]>([])
  const [gradeLevels, setGradeLevels] = useState<string[]>([])
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    loadStudents()
  }, [filters, currentPage, pageSize])

  const loadFilterOptions = async () => {
    try {
      // Load school years
      const { data: years, error: yearsError } = await db.studentProfiles.getDistinctSchoolYears()
      if (yearsError) throw yearsError
      setSchoolYears((years ?? []).filter((s): s is string => s != null) as string[])
      
      // Load grade levels
      const { data: grades, error: gradesError } = await db.studentProfiles.getDistinctGradeLevels()
      if (gradesError) throw gradesError
      setGradeLevels((grades ?? []).filter((s): s is string => s != null) as string[])
    } catch (err) {
      console.error('Failed to load filter options:', err)
    }
  }

  const loadStudents = async () => {
    try {
      setLoading(true)
      const { data, error, count } = await db.studentProfiles.getAll(
        filters,
        { page: currentPage, pageSize }
      )
      if (error) throw error
      
      setStudents(data || [])
      setTotalCount(count || 0)
      setTotalPages(Math.ceil((count || 0) / pageSize))
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
              <option value="10">10</option>
              <option value="25">25</option>
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
                    <th>Last Name</th>
                    <th>First Name</th>
                    <th>Middle Name</th>
                    <th>Extension Name</th>
                    <th>Sex</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id} className="border-b border-gray-300 dark:border-gray-700 odd:bg-gray-100 dark:odd:bg-gray-800/50">
                      <td className="p-3 font-mono text-gray-700 dark:text-gray-200">
                        {student.learner_reference_number || 'N/A'}
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