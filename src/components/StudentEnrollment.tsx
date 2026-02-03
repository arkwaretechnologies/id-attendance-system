'use client';

import React, { useState, useRef } from 'react';
import { useStudent } from '@/hooks/useStudent';
import { User, Mail, Calendar, MapPin, Phone, GraduationCap, Users } from 'lucide-react';

interface StudentEnrollmentProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

const StudentEnrollment = ({ onCancel, onSuccess }: StudentEnrollmentProps) => {
  const { createStudent, loading: contextLoading, error: contextError } = useStudent();
  
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copyAddress, setCopyAddress] = useState(false);
  const schoolYearRef = useRef<HTMLInputElement>(null);
  
  const loading = contextLoading;
  const error = localError || contextError;

  const initialFormData = {
    // Enrollment Information
    schoolYear: '',
    gradeLevel: '',
    withLRN: false,
    returningStudent: false,
    
    // Learner Information
    email: '',
    role: 'student',
    psaBirthCertificateNumber: '',
    lrn: '',
    lastName: '',
    firstName: '',
    middleName: '',
    extensionName: '',
    contactNo: '',
    birthDate: '',
    age: '',
    sex: '',
    motherTongue: '',
    belongsToIpCommunity: false,
    ipCommunityName: '',
    is4psBeneficiary: false,
    fourPsHouseholdId: '',
    placeOfBirth: '',
    
    // Current Address
    currentHouseNo: '',
    currentStreet: '',
    currentBarangay: '',
    currentMunicipality: '',
    currentProvince: '',
    currentCountry: 'Philippines',
    currentZipCode: '',
    
    // Permanent Address
    permanentHouseNo: '',
    permanentStreet: '',
    permanentBarangay: '',
    permanentMunicipality: '',
    permanentProvince: '',
    permanentCountry: 'Philippines',
    permanentZipCode: '',
    
    // Parent/Guardian Information
    fatherLastName: '',
    fatherFirstName: '',
    fatherMiddleName: '',
    fatherContactNo: '',
    motherLastName: '',
    motherFirstName: '',
    motherMiddleName: '',
    motherContactNo: '',
    guardianLastName: '',
    guardianFirstName: '',
    guardianMiddleName: '',
    guardianContactNo: '',
    
    // Educational Background
    lastGradeLevel: '',
    lastSchoolYear: '',
    lastSchoolName: '',
    lastSchoolId: '',
    lastSchoolAddress: '',
    generalAverage: '',
    shsStrand: '',
    shsCompleter: false,
    shsGenAve: '',
    shsTrack: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setLocalError('');
    setSuccess('');
    setCopyAddress(false);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    resetForm();
    // Focus on School Year field after successful save and reset
    setTimeout(() => {
      if (schoolYearRef.current) {
        schoolYearRef.current.focus();
      }
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value, type } = target;

    if (type === 'checkbox') {
      const checked = (target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Auto-calculate age when birth date changes
    if (name === 'birthDate' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        setFormData(prev => ({ ...prev, age: (age - 1).toString() }));
      } else {
        setFormData(prev => ({ ...prev, age: age.toString() }));
      }
    }
  };

  const handleCopyAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setCopyAddress(isChecked);
    
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        permanentHouseNo: prev.currentHouseNo,
        permanentStreet: prev.currentStreet,
        permanentBarangay: prev.currentBarangay,
        permanentMunicipality: prev.currentMunicipality,
        permanentProvince: prev.currentProvince,
        permanentCountry: prev.currentCountry,
        permanentZipCode: prev.currentZipCode
      }));
    }
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.contactNo) {
      return 'Please fill in all required fields.';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address.';
    }
    
    // Required learner information
    if (!formData.lastName || !formData.firstName || !formData.birthDate || !formData.sex) {
      return 'Please fill in all required learner information fields.';
    }
    
    // Age validation
    const age = parseInt(formData.age);
    if (age < 3 || age > 25) {
      return 'Age must be between 3 and 25 years for enrollment.';
    }
    
    // LRN validation (if provided, must be exactly 12 digits)
    if (formData.lrn && (!/^\d{12}$/.test(formData.lrn))) {
      return 'Learner Reference Number must be exactly 12 digits.';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');
    
    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    
    try {
      const studentData = {
        // Enrollment Information
        school_year: formData.schoolYear,
        grade_level: formData.gradeLevel,
        with_lrn: formData.withLRN,
        returning_student: formData.returningStudent,
        // Learner Information
        psa_birth_certificate_number: formData.psaBirthCertificateNumber,
        learner_reference_number: formData.lrn,
        last_name: formData.lastName,
        first_name: formData.firstName,
        middle_name: formData.middleName,
        extension_name: formData.extensionName,
        birthdate: formData.birthDate,
        age: formData.age,
        sex: formData.sex,
        mother_tongue: formData.motherTongue,
        email_address: formData.email,
        phone_number: formData.contactNo,
        current_house_number: formData.currentHouseNo,
        current_sitio_street: formData.currentStreet,
        current_barangay: formData.currentBarangay,
        current_municipality_city: formData.currentMunicipality,
        current_province: formData.currentProvince,
        current_country: formData.currentCountry,
        current_zip_code: formData.currentZipCode,
        permanent_house_number: formData.permanentHouseNo,
        permanent_street: formData.permanentStreet,
        permanent_barangay: formData.permanentBarangay,
        permanent_municipality_city: formData.permanentMunicipality,
        permanent_province: formData.permanentProvince,
        permanent_country: formData.permanentCountry,
        permanent_zip_code: formData.permanentZipCode,
        same_as_current_address: copyAddress,
        place_of_birth_municipality_city: formData.placeOfBirth,
        belongs_to_ip_community: formData.belongsToIpCommunity,
        ip_community_name: formData.ipCommunityName,
        is_4ps_beneficiary: formData.is4psBeneficiary,
        four_ps_household_id: formData.fourPsHouseholdId,
        father_last_name: formData.fatherLastName,
        father_first_name: formData.fatherFirstName,
        father_middle_name: formData.fatherMiddleName,
        father_contact_number: formData.fatherContactNo,
        mother_last_name: formData.motherLastName,
        mother_first_name: formData.motherFirstName,
        mother_middle_name: formData.motherMiddleName,
        mother_contact_number: formData.motherContactNo,
        guardian_last_name: formData.guardianLastName,
        guardian_first_name: formData.guardianFirstName,
        guardian_middle_name: formData.guardianMiddleName,
        guardian_contact_number: formData.guardianContactNo,
        last_grade_level_completed: formData.lastGradeLevel,
        last_school_year_completed: formData.lastSchoolYear,
        last_school_attended: formData.lastSchoolName,
        last_school_id: formData.lastSchoolId,
      };

      const result = await createStudent(studentData);
      
      if (result) {
        setShowSuccessModal(true);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to enroll student. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="rounded-xl shadow-lg overflow-hidden" style={{backgroundColor: 'var(--color-bg-primary)'}}>
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-8">
            <div className="text-center">
              <h1 className="text-white">Student Enrollment</h1>
              <p className="text-primary-100">Complete your registration for Basic Education</p>
              <p className="text-primary-200 text-sm mt-2">All fields marked with * are required</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}
            
            {/* Enrollment Information */}
            <div className="rounded-xl shadow-sm p-8 border border-primary-100" style={{backgroundColor: 'var(--color-bg-primary)'}}>
              <h2 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                <GraduationCap className="w-7 h-7 text-primary-600" />
                Enrollment Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    School Year *
                  </label>
                  <input
                    ref={schoolYearRef}
                    type="text"
                    name="schoolYear"
                    value={formData.schoolYear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="E.g., 2024-2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Grade Level to Enroll *
                  </label>
                  <select
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Grade Level</option>
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="withLRN"
                    name="withLRN"
                    checked={formData.withLRN}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="withLRN" className="text-sm font-medium" style={{color: 'var(--color-text)'}}>
                    With LRN?
                  </label>
                  <div className="flex space-x-4 ml-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="withLRNOption"
                        value="yes"
                        checked={formData.withLRN === true}
                        onChange={(e) => setFormData(prev => ({ ...prev, withLRN: true }))}
                        className="mr-2"
                      />
                      <span className="text-sm" style={{color: 'var(--color-text)'}}>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="withLRNOption"
                        value="no"
                        checked={formData.withLRN === false}
                        onChange={(e) => setFormData(prev => ({ ...prev, withLRN: false }))}
                        className="mr-2"
                      />
                      <span className="text-sm" style={{color: 'var(--color-text)'}}>No</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="returningStudent"
                    name="returningStudent"
                    checked={formData.returningStudent}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="returningStudent" className="text-sm font-medium" style={{color: 'var(--color-text)'}}>
                    Returning (Balik-Aral)
                  </label>
                  <div className="flex space-x-4 ml-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="returningStudentOption"
                        value="yes"
                        checked={formData.returningStudent === true}
                        onChange={(e) => setFormData(prev => ({ ...prev, returningStudent: true }))}
                        className="mr-2"
                      />
                      <span className="text-sm" style={{color: 'var(--color-text)'}}>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="returningStudentOption"
                        value="no"
                        checked={formData.returningStudent === false}
                        onChange={(e) => setFormData(prev => ({ ...prev, returningStudent: false }))}
                        className="mr-2"
                      />
                      <span className="text-sm" style={{color: 'var(--color-text)'}}>No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Learner Information */}
            <div className="rounded-xl shadow-sm p-8 border border-primary-100" style={{backgroundColor: 'var(--color-bg-primary)'}}>
              <h2 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                <GraduationCap className="w-7 h-7 text-primary-600" />
                Learner Information
              </h2>
              
              {/* First Row: PSA Birth Certificate and LRN - Full Width */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PSA Birth Certificate No.
                  </label>
                  <input
                    type="text"
                    name="psaBirthCertificateNumber"
                    value={formData.psaBirthCertificateNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="PSA Birth Certificate Number"
                  />
                  <p className="text-xs text-primary-500 mt-1">If available upon registration</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learner Reference Number (LRN)
                  </label>
                  <input
                    type="text"
                    name="lrn"
                    value={formData.lrn}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12-Digit LRN"
                    maxLength={12}
                    pattern="[0-9]{12}"
                    title="Learner Reference Number must be exactly 12 digits"
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      const input = e.currentTarget;
                      input.value = input.value.replace(/[^0-9]/g, '');
                    }}
                  />
                  <p className="text-xs text-primary-500 mt-1">Input 12 digit LRN</p>
                </div>
              </div>

              {/* Second Row: Name Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Last Name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter First Name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Middle Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extension Name
                  </label>
                  <input
                    type="text"
                    name="extensionName"
                    value={formData.extensionName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jr., Sr., III, etc."
                  />
                </div>

                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="contactNo"
                      value={formData.contactNo}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter Contact Number"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter Email Address"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{backgroundColor: 'var(--color-bg-secondary)'}}
                    placeholder="Auto-Calculated"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Place of Birth (Municipality/City)
                  </label>
                  <input
                    type="text"
                    name="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Place Of Birth"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Sex *
                  </label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Mother Tongue
                  </label>
                  <input
                    type="text"
                    name="motherTongue"
                    value={formData.motherTongue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Mother Tongue"
                  />
                </div>

                {/* IP Community */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Belonging to any Indigenous Peoples (IP) Community/Indigenous Cultural Community
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="belongsToIpCommunity"
                        value="yes"
                        checked={formData.belongsToIpCommunity === true}
                        onChange={() => setFormData(prev => ({ ...prev, belongsToIpCommunity: true }))}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm" style={{color: 'var(--color-text)'}}>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="belongsToIpCommunity"
                        value="no"
                        checked={formData.belongsToIpCommunity === false}
                        onChange={() => setFormData(prev => ({ ...prev, belongsToIpCommunity: false, ipCommunityName: '' }))}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm" style={{color: 'var(--color-text)'}}>No</span>
                    </label>
                  </div>
                  {formData.belongsToIpCommunity && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium mb-1" style={{color: 'var(--color-text)'}}>
                        If Yes, please specify:
                      </label>
                      <input
                        type="text"
                        name="ipCommunityName"
                        value={formData.ipCommunityName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter Community Name"
                      />
                    </div>
                  )}
                </div>

                {/* 4Ps Beneficiary */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Is your family a beneficiary of 4Ps?
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is4psBeneficiary"
                        value="yes"
                        checked={formData.is4psBeneficiary === true}
                        onChange={() => setFormData(prev => ({ ...prev, is4psBeneficiary: true }))}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm" style={{color: 'var(--color-text)'}}>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is4psBeneficiary"
                        value="no"
                        checked={formData.is4psBeneficiary === false}
                        onChange={() => setFormData(prev => ({ ...prev, is4psBeneficiary: false, fourPsHouseholdId: '' }))}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm" style={{color: 'var(--color-text)'}}>No</span>
                    </label>
                  </div>
                  {formData.is4psBeneficiary && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium mb-1" style={{color: 'var(--color-text)'}}>
                        If Yes, write the 4Ps Household ID Number below
                      </label>
                      <input
                        type="text"
                        name="fourPsHouseholdId"
                        value={formData.fourPsHouseholdId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter 4Ps Household ID"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Current Address */}
            <div className="border border-gray-200 rounded-md p-6" style={{backgroundColor: 'var(--color-bg-primary)'}}>
              <h2 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                <MapPin className="w-7 h-7 text-primary-600" />
                Current Address
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    House No./Street
                  </label>
                  <input
                    type="text"
                    name="currentHouseNo"
                    value={formData.currentHouseNo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="House Number And Street"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Barangay
                  </label>
                  <input
                    type="text"
                    name="currentBarangay"
                    value={formData.currentBarangay}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Barangay"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Municipality/City
                  </label>
                  <input
                    type="text"
                    name="currentMunicipality"
                    value={formData.currentMunicipality}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Municipality/City"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Province
                  </label>
                  <input
                    type="text"
                    name="currentProvince"
                    value={formData.currentProvince}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Province"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Country
                  </label>
                  <input
                    type="text"
                    name="currentCountry"
                    value={formData.currentCountry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Country"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="currentZipCode"
                    value={formData.currentZipCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ZIP Code"
                  />
                </div>
              </div>
            </div>
            
            {/* Permanent Address */}
            <div className="border border-gray-200 rounded-md p-6" style={{backgroundColor: 'var(--color-bg-primary)'}}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-primary-900 flex items-center">
                  <MapPin className="w-7 h-7 text-primary-600" />
                  Permanent Address
                </h2>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={copyAddress}
                    onChange={handleCopyAddress}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm" style={{color: 'var(--color-text)'}}>Same as current address</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    House No./Street
                  </label>
                  <input
                    type="text"
                    name="permanentHouseNo"
                    value={formData.permanentHouseNo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="House Number and Street"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Barangay
                  </label>
                  <input
                    type="text"
                    name="permanentBarangay"
                    value={formData.permanentBarangay}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Barangay"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Municipality/City
                  </label>
                  <input
                    type="text"
                    name="permanentMunicipality"
                    value={formData.permanentMunicipality}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Municipality/City"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Province
                  </label>
                  <input
                    type="text"
                    name="permanentProvince"
                    value={formData.permanentProvince}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Province"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Country
                  </label>
                  <input
                    type="text"
                    name="permanentCountry"
                    value={formData.permanentCountry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Country"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="permanentZipCode"
                    value={formData.permanentZipCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>
            </div>
            
            {/* Parent/Guardian Information */}
            <div className="border border-gray-200 rounded-md p-6" style={{backgroundColor: 'var(--color-bg-primary)'}}>
              <h2 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                <Users className="w-7 h-7 text-primary-600" />
                Parent/Guardian Information
              </h2>
              
              {/* Father Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3" style={{color: 'var(--color-text)'}}>Father&apos;s Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="fatherLastName"
                      value={formData.fatherLastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Father's Last Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      First Name
                    </label>
                    <input
                      type="text"
                      name="fatherFirstName"
                      value={formData.fatherFirstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Father's First Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="fatherMiddleName"
                      value={formData.fatherMiddleName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Father's Middle Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      Contact Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="fatherContactNo"
                        value={formData.fatherContactNo}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Father's Contact Number"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mother Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3" style={{color: 'var(--color-text)'}}>Mother&apos;s Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="motherLastName"
                      value={formData.motherLastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mother's Last Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      First Name
                    </label>
                    <input
                      type="text"
                      name="motherFirstName"
                      value={formData.motherFirstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mother's First Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="motherMiddleName"
                      value={formData.motherMiddleName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mother's Middle Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      Contact Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="motherContactNo"
                        value={formData.motherContactNo}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Mother's Contact Number"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Guardian Information */}
              <div>
                <h3 className="text-lg font-medium mb-3" style={{color: 'var(--color-text)'}}>Guardian&apos;s Information (if applicable)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="guardianLastName"
                      value={formData.guardianLastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Guardian's Last Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      First Name
                    </label>
                    <input
                      type="text"
                      name="guardianFirstName"
                      value={formData.guardianFirstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Guardian's First Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="guardianMiddleName"
                      value={formData.guardianMiddleName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Guardian's Middle Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                      Contact Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="guardianContactNo"
                        value={formData.guardianContactNo}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Guardian's Contact Number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Educational Background */}
            <div className="border border-gray-200 rounded-md p-6" style={{backgroundColor: 'var(--color-bg-primary)'}}>
              <h2 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                <GraduationCap className="w-7 h-7 text-primary-600" />
                Educational Background
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Last Grade Level Completed
                  </label>
                  <input
                    type="text"
                    name="lastGradeLevel"
                    value={formData.lastGradeLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="E.g., Grade 10, Grade 12"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Last School Year Completed
                  </label>
                  <input
                    type="text"
                    name="lastSchoolYear"
                    value={formData.lastSchoolYear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="E.g., 2022-2023"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    Last School Attended
                  </label>
                  <input
                    type="text"
                    name="lastSchoolName"
                    value={formData.lastSchoolName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Name Of Last School Attended"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                    School ID
                  </label>
                  <input
                    type="text"
                    name="lastSchoolId"
                    value={formData.lastSchoolId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="School ID Number"
                  />
                </div>
              </div>
              
              {/* Senior High School Information */}
              <div className="border-t pt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="shsCompleter"
                    checked={formData.shsCompleter}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <label className="text-sm font-medium" style={{color: 'var(--color-text)'}}>
                    Senior High School Completer
                  </label>
                </div>
                
                {formData.shsCompleter && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                        General Average
                      </label>
                      <input
                        type="number"
                        name="shsGenAve"
                        value={formData.shsGenAve}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="General Average"
                        min="75"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                        Track
                      </label>
                      <select
                        name="shsTrack"
                        value={formData.shsTrack}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select track</option>
                        <option value="Academic Track">Academic Track</option>
                        <option value="Technical-Vocational-Livelihood (TVL) Track">Technical-Vocational-Livelihood (TVL) Track</option>
                        <option value="Sports Track">Sports Track</option>
                        <option value="Arts and Design Track">Arts and Design Track</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{color: 'var(--color-text)'}}>
                        Strand
                      </label>
                      <input
                        type="text"
                        name="shsStrand"
                        value={formData.shsStrand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="E.g., STEM, ABM, HUMSS"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-primary-100">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-4 border-2 border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
              >
                {loading ? 'Enrolling Student...' : 'Enroll Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-8 max-w-md w-full mx-4 shadow-xl" style={{backgroundColor: 'var(--color-bg-primary)'}}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-4" style={{color: 'var(--color-text)'}}>
                Student Information Successfully Saved
              </h3>
              <button
                onClick={handleSuccessModalClose}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentEnrollment;