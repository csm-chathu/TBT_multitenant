import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as yup from 'yup';
import NavigationBar from '../components/Molecules/landing/NavigationBar';
import { Footer } from '@/components/Molecules/landing/Footer';
import InputField from '@/components/Molecules/InputField';
import PhoneInputField from '@/components/Molecules/PhoneInputField';
import SelectField from '@/components/Molecules/SelectField';
import RadioGroup from '@/components/Molecules/RadioGroup';
import FormField from '@/components/Molecules/FormField';
import FileUploadField from '@/components/Molecules/FileUploadField';
import useToast from '@/hooks/useToast';
import { validateFiles, FileValidationError, FILE_UPLOAD_CONSTRAINTS } from '@/lib/fileValidation';
import {
  getPublicFormOptions,
  createPublicTicket,
  PublicFormOptions,
  PublicTicketResponse,
} from '@/services/ticketService';
import {
  phoneNumberValidator,
  emailValidator,
  nameValidator,
  requiredStringValidator,
  oneOfValidator,
  validateForm,
} from '@/lib/validationSchemas';
import {
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  LifeBuoy,
  FileText,
  User,
  ArrowLeft,
  PlusCircle,
} from 'lucide-react';

interface PublicTicketFormData {
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  mobile_number: string;
  title: string;
  body: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  application_id: string;
  serialNo: string;
}

// Yup validation schema matching Add Ticket page validation rules
const publicTicketValidationSchema = yup.object({
  customer_first_name: nameValidator('First name'),
  customer_last_name: yup
    .string()
    .optional()
    .test('valid-name', 'Last name can only contain letters, spaces, hyphens, and apostrophes', (val) => {
      if (!val) return true;
      return /^[a-zA-Z\s\-']+$/.test(val);
    }),
  customer_email: emailValidator,
  mobile_number: phoneNumberValidator,
  application_id: yup
    .string()
    .required('Please select an application')
    .test('not-empty', 'Please select an application', (value) => !!value && value !== ''),
  priority: oneOfValidator('Priority', ['Low', 'Medium', 'High', 'Critical', 'low', 'medium', 'high', 'critical'] as const),
  title: requiredStringValidator('Issue subject', 3, 200),
  body: requiredStringValidator('Detailed description', 5, 2000),
});

const PublicTicketCreation: React.FC = () => {
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  // Form State
  const [formData, setFormData] = useState<PublicTicketFormData>({
    customer_first_name: '',
    customer_last_name: '',
    customer_email: '',
    mobile_number: '',
    title: '',
    body: '',
    priority: 'Medium',
    application_id: '',
    serialNo: '',
  });

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileValidationErrors, setFileValidationErrors] = useState<FileValidationError[]>([]);

  // Options state
  const [options, setOptions] = useState<PublicFormOptions>({
    applications: [],
    priorities: [
      { value: 'Low', label: 'Low - Minor issue' },
      { value: 'Medium', label: 'Medium - Normal request' },
      { value: 'High', label: 'High - System impacted' },
      { value: 'Critical', label: 'Critical - System down' },
    ],
  });

  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedData, setSubmittedData] = useState<PublicTicketResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const data = await getPublicFormOptions();
      setOptions(data);
      if (data.applications && data.applications.length > 0) {
        setFormData((prev) => ({
          ...prev,
          application_id: String(data.applications[0].id),
        }));
      }
    } catch (err) {
      console.warn('Failed to load application options from server:', err);
      setOptions({
        applications: [
          { id: 1, name: 'TBT Support System' },
          { id: 2, name: 'Billing & Account Services' },
        ],
        priorities: [
          { value: 'Low', label: 'Low - Minor issue' },
          { value: 'Medium', label: 'Medium - Normal request' },
          { value: 'High', label: 'High - System impacted' },
          { value: 'Critical', label: 'Critical - System down' },
        ],
      });
      setFormData((prev) => ({ ...prev, application_id: '1' }));
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleFieldChange = (name: keyof PublicTicketFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for edited field
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        delete updated.general;
        return updated;
      });
    }
  };

  // File Upload Handlers (matching HelpDeskForm / CyberForm)
  const handleFileUpload = (files: FileList | null) => {
    if (!files) {
      setSelectedFiles([]);
      setFileValidationErrors([]);
      return;
    }
    const newFiles = Array.from(files);
    
    // Merge new files with existing ones, avoiding duplicates
    const existingFileNames = new Set(selectedFiles.map((f) => f.name + f.size + f.lastModified));
    const uniqueNewFiles = newFiles.filter((f) => !existingFileNames.has(f.name + f.size + f.lastModified));
    const combinedFiles = [...selectedFiles, ...uniqueNewFiles];

    if (combinedFiles.length > FILE_UPLOAD_CONSTRAINTS.MAX_FILES) {
      const excessCount = combinedFiles.length - FILE_UPLOAD_CONSTRAINTS.MAX_FILES;
      const fileErrors: FileValidationError[] = [
        {
          type: 'count',
          message: `Maximum ${FILE_UPLOAD_CONSTRAINTS.MAX_FILES} files allowed. You already have ${selectedFiles.length} file(s) and tried to add ${newFiles.length} more. Please remove ${excessCount} file(s) first.`,
        },
      ];
      setFileValidationErrors(fileErrors);
      return;
    }

    const validation = validateFiles(combinedFiles);
    setFileValidationErrors(validation.errors);
    setSelectedFiles(combinedFiles.slice(0, FILE_UPLOAD_CONSTRAINTS.MAX_FILES));
  };

  const handleFileRemove = (indexToRemove: number) => {
    const updatedFiles = selectedFiles.filter((_, idx) => idx !== indexToRemove);
    setSelectedFiles(updatedFiles);
    if (updatedFiles.length > 0) {
      const validation = validateFiles(updatedFiles);
      setFileValidationErrors(validation.errors);
    } else {
      setFileValidationErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate using Yup schema matching Add Ticket form logic
    const { isValid, errors: validationErrors } = await validateForm(
      publicTicketValidationSchema,
      formData
    );

    if (fileValidationErrors.length > 0) {
      showErrorToast('Please resolve file upload issues before submitting.');
      return;
    }

    if (!isValid) {
      setErrors(validationErrors);
      showErrorToast('Please fix the validation errors in the form before submitting.');
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await createPublicTicket({
        customer_first_name: formData.customer_first_name.trim(),
        customer_last_name: formData.customer_last_name.trim() || undefined,
        customer_email: formData.customer_email.trim(),
        mobile_number: formData.mobile_number.trim(),
        title: formData.title.trim(),
        body: formData.body.trim(),
        priority: formData.priority,
        application_id: Number(formData.application_id),
        serialNo: formData.serialNo.trim() || undefined,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      });

      setSubmittedData(response);
      showSuccessToast('Support ticket submitted successfully!');
    } catch (err: any) {
      console.error('Failed to submit ticket:', err);
      const apiMessage =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : 'Unable to submit ticket. Please check your information and try again.');
      setErrors({ general: apiMessage });
      showErrorToast(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReference = () => {
    if (submittedData?.referenceNumber) {
      navigator.clipboard.writeText(submittedData.referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setSelectedFiles([]);
    setFileValidationErrors([]);
    setFormData({
      customer_first_name: '',
      customer_last_name: '',
      customer_email: '',
      mobile_number: '',
      title: '',
      body: '',
      priority: 'Medium',
      application_id: options.applications.length > 0 ? String(options.applications[0].id) : '1',
      serialNo: '',
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary text-textColor-base">
      <NavigationBar />

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Banner Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-surface-tertiary text-primary-500 rounded-full mb-3 shadow-sm border border-borderColor-secondary">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-textColor-base tracking-tight sm:text-4xl">
            Submit a Support Ticket
          </h1>
          <p className="mt-2 text-base text-textColor-muted max-w-xl mx-auto">
            Need help? Fill out the form below to submit a support request. Our technical support team will process your ticket promptly.
          </p>
        </div>

        {submittedData ? (
          /* SUCCESS CONFIRMATION VIEW */
          <div className="bg-surface-primary rounded-2xl shadow-xl border border-borderColor-secondary p-8 sm:p-10 transition-all">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 text-success-500 rounded-full mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-bold text-textColor-base">
                Ticket Submitted Successfully!
              </h2>

              <p className="mt-2 text-sm text-textColor-muted">
                Your ticket has been generated in the TBT ticketing system. Please keep your reference number for tracking.
              </p>

              {/* Prominent Ticket Reference Box */}
              <div className="mt-6 bg-surface-secondary border border-borderColor-secondary rounded-xl p-6 max-w-md mx-auto">
                <span className="text-xs uppercase tracking-wider text-textColor-muted font-semibold block mb-1">
                  Ticket Reference Number
                </span>

                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-primary-500 tracking-wider">
                    {submittedData.referenceNumber}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyReference}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition"
                    title="Copy reference number"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span className="font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-borderColor-secondary text-xs text-textColor-muted">
                  Ticket ID: <span className="font-semibold text-textColor-base">#{submittedData.ticket.id}</span> &bull; Status: <span className="text-success-500 font-semibold">{submittedData.ticket.status}</span>
                </div>
              </div>

              {/* Additional Guidance */}
              <div className="mt-6 text-xs text-textColor-muted max-w-md mx-auto space-y-1">
                <p>We've registered your request under <span className="font-medium text-textColor-base">{formData.customer_email}</span>.</p>
                <p>A support representative will inspect your request and reach out to your phone line (<span className="font-medium text-textColor-base">{formData.mobile_number}</span>).</p>
                {selectedFiles.length > 0 && (
                  <p className="text-primary-500 font-medium">{selectedFiles.length} file attachment(s) uploaded successfully.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleResetForm}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm rounded-xl shadow transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  Submit Another Ticket
                </button>

                <Link
                  to="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-surface-tertiary hover:bg-surface-quaternary text-textColor-base font-medium text-sm rounded-xl transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home Page
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* TICKET CREATION FORM */
          <div className="bg-surface-primary rounded-2xl shadow-xl border border-borderColor-secondary p-6 sm:p-10">
            {errors.general && (
              <div className="mb-6 p-4 bg-danger-100 border border-danger-500/30 rounded-xl flex items-start gap-3 text-danger-600 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-danger-500 mt-0.5" />
                <div>
                  <span className="font-semibold block">Submission Error</span>
                  {errors.general}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECTION 1: CUSTOMER INFORMATION */}
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-borderColor-secondary mb-5">
                  <User className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-bold text-textColor-base">
                    1. Customer Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* First Name */}
                  <InputField
                    label="First Name"
                    name="customer_first_name"
                    value={formData.customer_first_name}
                    onChange={(val) => handleFieldChange('customer_first_name', val)}
                    placeholder="John"
                    required
                    lettersOnly
                    error={errors.customer_first_name}
                  />

                  {/* Last Name */}
                  <InputField
                    label="Last Name"
                    name="customer_last_name"
                    value={formData.customer_last_name}
                    onChange={(val) => handleFieldChange('customer_last_name', val)}
                    placeholder="Doe"
                    lettersOnly
                    error={errors.customer_last_name}
                  />

                  {/* Email */}
                  <InputField
                    label="Email Address"
                    name="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(val) => handleFieldChange('customer_email', val)}
                    placeholder="john.doe@example.com"
                    required
                    error={errors.customer_email}
                  />

                  {/* Phone Number using PhoneInputField */}
                  <PhoneInputField
                    label="Phone Number"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={(val) => handleFieldChange('mobile_number', val)}
                    placeholder="Phone Number"
                    required
                    error={errors.mobile_number}
                    defaultCountry="US"
                  />
                </div>
              </div>

              {/* SECTION 2: TICKET DETAILS */}
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-borderColor-secondary mb-5">
                  <FileText className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-bold text-textColor-base">
                    2. Issue Details
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Application Dropdown */}
                  <div>
                    <SelectField
                      label="Application / System"
                      name="application_id"
                      value={formData.application_id}
                      onChange={(val) => handleFieldChange('application_id', val)}
                      options={options.applications.map((app) => ({
                        value: String(app.id),
                        label: app.name,
                      }))}
                      placeholder="Select an application"
                      required
                      error={errors.application_id}
                      disabled={loadingOptions}
                    />
                  </div>

                  {/* Priority Radio Group */}
                  <div>
                    <RadioGroup
                      name="priority"
                      label="Select Priority"
                      value={formData.priority}
                      onChange={(val) => handleFieldChange('priority', val)}
                      options={[
                        { value: 'Low', label: 'Low' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'High', label: 'High' },
                        { value: 'Critical', label: 'Critical' },
                      ]}
                      orientation="horizontal"
                      required
                      disabled={submitting}
                      error={errors.priority}
                    />
                  </div>

                  {/* Title / Subject */}
                  <InputField
                    label="Issue Subject / Title"
                    name="title"
                    value={formData.title}
                    onChange={(val) => handleFieldChange('title', val)}
                    placeholder="e.g., Cannot access reporting portal or printer error"
                    required
                    error={errors.title}
                  />

                  {/* Detailed Description */}
                  <FormField
                    label="Detailed Issue Description"
                    required
                    error={errors.body}
                    htmlFor="body"
                  >
                    <textarea
                      id="body"
                      name="body"
                      rows={5}
                      value={formData.body}
                      onChange={(e) => handleFieldChange('body', e.target.value)}
                      placeholder="Please provide step-by-step details about the issue you are experiencing..."
                      className={`w-full px-4 py-3 bg-surface-secondary border rounded-xl text-textColor-base placeholder:text-textColor-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                        errors.body
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-borderColor-secondary'
                      }`}
                    />
                  </FormField>

                  {/* File Attachment Drag and Drop Field */}
                  <FileUploadField
                    label="Attachments (Optional)"
                    name="files"
                    selectedFiles={selectedFiles}
                    onFileChange={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    onValidationError={(errs) => setFileValidationErrors(errs)}
                    disabled={submitting}
                    maxSize="10MB"
                    multiple={true}
                    acceptedTypes="JPEG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX, XLS, XLSX"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end gap-4 border-t border-borderColor-secondary">
                <Link
                  to="/"
                  className="px-5 py-2.5 text-sm font-medium text-textColor-muted hover:text-textColor-base transition"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-7 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm rounded-xl shadow hover:shadow-primary-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Ticket...</span>
                    </>
                  ) : (
                    <>
                      <LifeBuoy className="w-4 h-4" />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PublicTicketCreation;
