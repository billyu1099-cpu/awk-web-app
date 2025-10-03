import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Building, DollarSign, FileText, Clock, CheckCircle, AlertCircle, Users, Edit, Loader2, X, ChevronDown, Upload, Download, Eye, MessageSquare, Archive, Play, Lock, Printer } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import EditProjectModal from './EditProjectModal';

interface ProjectComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  mentions: string[];
}

interface ProjectDocument {
  id: string;
  name: string;
  category: 'Source Docs' | 'Working Papers' | 'Final Returns' | 'Client Correspondence';
  uploadDate: string;
  size: string;
  type: string;
  version: number;
  file_path: string;
  uploaded_by: string;
}

interface ActivityLogEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details: string;
}

interface ProjectOverviewProps {
  projectId: string;
  onBack: () => void;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projectId, onBack }) => {
  const { project, loading, error, refetch } = useProject(projectId);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInvoiceEditModalOpen, setIsInvoiceEditModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProjectDocument['category']>('Source Docs');
  const [invoiceFormData, setInvoiceFormData] = useState<any>({});
  const [isUpdatingInvoice, setIsUpdatingInvoice] = useState(false);
  const [invoiceUpdateError, setInvoiceUpdateError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [todoOrUpdateNote, setTodoOrUpdateNote] = useState('');
  const [isLoadingTodoOrUpdate, setIsLoadingTodoOrUpdate] = useState(false);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  // Single overall status state helpers
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const statusOptions = [
    'Client to sign engagement and pay deposit',
    'Not start—info to come',
    'To Do',
    'Work in progress (WIP)',
    'Ready for reviewer/partner to review',
    'Reviewed',
    'staff to update',
    'Ready for final review',
    'For client review & approval',
    'For client signature',
    'To efile & prepare invoice (client signed)',
    'Completed'
  ];

  useEffect(() => {
    if (project) {
      setIsLocked(project.is_locked ?? false);
    }
  }, [project]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserProfile(data);
      }
    };
    fetchUserProfile();
  }, [user]);

  // Fetch comments when project loads or tab changes to comments
  useEffect(() => {
    if (project?.project_id && activeTab === 'comments') {
      fetchComments();
    }
  }, [project, activeTab]);

  // Also fetch comments when project first loads (for initial data)
  useEffect(() => {
    if (project?.project_id) {
      fetchComments();
    }
  }, [project?.project_id]);

  // Fetch documents when project loads or tab changes to documents
  useEffect(() => {
    if (project?.project_id && activeTab === 'documents') {
      fetchDocuments();
    }
  }, [project, activeTab]);

  // Also fetch documents when project first loads
  useEffect(() => {
    if (project?.project_id) {
      fetchDocuments();
      fetchUserProfile();
    }
  }, [project?.project_id]);

  // Initialize invoice form data when project loads
  useEffect(() => {
    if (project) {
      setInvoiceFormData({
        invoice_number: project.invoice_number || '',
        amount: project.amount?.toString() || '',
        hst_amount: project.hst_amount?.toString() || '',
        amount_received: project.amount_received?.toString() || '',
        approximated_actual_time_used: project.approximated_actual_time_used?.toString() || '',
        date_of_efile_mail: project.date_of_efile_mail || '',
        outstanding: project.outstanding?.toString() || ''
      });
    }
  }, [project]);

  // When project loads or changes, reset pendingStatus
  useEffect(() => {
    setPendingStatus(null);
  }, [project?.status]);

  useEffect(() => {
  if (
    project &&
    (pendingStatus === 'To Do' ||
      pendingStatus === 'staff to update' ||
      project.status === 'To Do' ||
      project.status === 'staff to update')
  ) {
    setIsLoadingTodoOrUpdate(true);
    supabase
      .from('projects')
      .select('to_do_or_update')
      .eq('project_id', project.project_id)
      .single()
      .then(({ data }) => {
        setTodoOrUpdateNote(data?.to_do_or_update || '');
      })
      .finally(() => setIsLoadingTodoOrUpdate(false));
  } else {
    setTodoOrUpdateNote('');
  }
  // eslint-disable-next-line
}, [project?.project_id, pendingStatus, project?.status]);

  const handleStatusSelect = (newStatus: string) => {
    setPendingStatus(newStatus);
    setStatusUpdateError(null);

    if (newStatus !== 'To Do' && newStatus !== 'staff to update') {
    setTodoOrUpdateNote('');
  }
  };

  const handleExportCSV = () => {
  if (!project) return;
  // Flatten project object for CSV
  const flatten = (obj: any, prefix = '') =>
    Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '.' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flatten(obj[k], pre + k));
      } else {
        acc[pre + k] = Array.isArray(obj[k]) ? obj[k].join('; ') : obj[k];
      }
      return acc;
    }, {} as Record<string, any>);
  const flat = flatten(project);
  const headers = Object.keys(flat);
  const csv =
    headers.join(',') +
    '\n' +
    headers.map(h => `"${String(flat[h]).replace(/"/g, '""')}"`).join(',');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `project_${project.project_id || project.id}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const handlePrintPDF = () => {
  if (!project) return;
  // Helper to get display name from staff array
  const getName = (id: string) => {
    const member = staff.find(s => s.id === id);
    return member ? [member.first_name, member.last_name].filter(Boolean).join(' ') : id;
  };
  // Build a printable HTML string with all project details
  const flatten = (obj: any, prefix = '') =>
    Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '.' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flatten(obj[k], pre + k));
      } else if (k === 'preparer' && Array.isArray(obj[k])) {
        acc[pre + k] = obj[k].map(getName).join(', ');
      } else if (k === 'reviewer') {
        acc[pre + k] = getName(obj[k]);
      } else {
        acc[pre + k] = Array.isArray(obj[k]) ? obj[k].join('; ') : obj[k];
      }
      return acc;
    }, {} as Record<string, any>);

  const flat = flatten(project);
  const style = `
    <style>
      body { font-family: Inter, Arial, sans-serif; padding: 24px; color: #111827; }
      h1 { font-size: 2rem; margin-bottom: 1rem; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
      th, td { padding: 6px 8px; border: 1px solid #e5e7eb; text-align: left; }
      th { background: #f9fafb; }
      tr:nth-child(even) { background: #f3f4f6; }
    </style>
  `;
  const rows = Object.entries(flat)
    .map(
      ([k, v]) =>
        `<tr><th>${k.replace(/\./g, ' > ')}</th><td>${String(v)}</td></tr>`
    )
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8">${style}<title>Project Details</title></head><body>
    <h1>Project Details - ${project.project_name || project.name || ''}</h1>
    <table>${rows}</table>
  </body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 250);
};
  
  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setUserProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('comments')
        .eq('project_id', parseInt(projectId))
        .single();

      if (error) throw error;

      if (projectData?.comments) {
        try {
          const parsedComments = JSON.parse(projectData.comments);
          setComments(Array.isArray(parsedComments) ? parsedComments : []);
        } catch {
          setComments([]);
        }
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsPostingComment(true);
    try {
      const comment: ProjectComment = {
        id: Date.now().toString(),
        author: user?.user_metadata?.first_name || user?.email || 'Unknown User',
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
        mentions: []
      };
      const updatedComments = [comment, ...comments];

      const { error } = await supabase
        .from('projects')
        .update({
          comments: JSON.stringify(updatedComments),
          updated_at: new Date().toISOString(),
          last_modified_by: user?.email || 'Unknown User'
        })
        .eq('project_id', parseInt(projectId));
      if (error) throw error;
      setComments(updatedComments);
      setNewComment('');
      // --- Send notification to all preparers and reviewer except commenter ---
    if (project) {
      const preparers = Array.isArray(project.preparer) ? project.preparer : [];
      const reviewer = project.reviewer ? [project.reviewer] : [];
      // Combine and remove the commenter
      const allRecipients = [...preparers, ...reviewer].filter(
        name =>
          name &&
          name !== (user?.user_metadata?.first_name
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
            : user?.email || 'Unknown User')
      );

      // Fetch user IDs for these names (assuming names are unique, or use emails if available)
      if (allRecipients.length > 0) {
        const { data: usersToNotify } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('first_name', allRecipients.map(n => n.split(' ')[0]))
          .in('last_name', allRecipients.map(n => n.split(' ')[1] || ''));

        if (usersToNotify && usersToNotify.length > 0) {
          const notifications = usersToNotify.map((recipient) => ({
            user_id: recipient.id,
            title: `New comment on ${project.project_name}`,
            message: `${user?.user_metadata?.first_name
              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
              : user?.email || 'Unknown User'} sent a comment about the project`,
            is_read: false,
            created_at: new Date().toISOString(),
          }));
          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
          }
        }
      }
    }
    // --- End notification logic ---
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsPostingComment(false);
    }
  };

  const fetchDocuments = async () => {
    if (!project?.project_id) return;

    setIsLoadingDocuments(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('notes')
        .eq('project_id', project.project_id)
        .single();

      if (error) throw error;

      let projectDocuments = [];
      if (data?.notes) {
        try {
          const notesData = typeof data.notes === 'string' ? JSON.parse(data.notes) : data.notes;
          if (notesData && notesData.documents && Array.isArray(notesData.documents)) {
            projectDocuments = notesData.documents;
          }
        } catch (e) {
          console.error('Error parsing documents JSON:', e);
          projectDocuments = [];
        }
      }
      setDocuments(Array.isArray(projectDocuments) ? projectDocuments : []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
  // Fetch all staff/profiles for name lookup
  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email');
    if (!error && data) setStaff(data);
  };
  fetchStaff();
}, []);

  const getStaffDisplayName = (profile: Profile) =>
  [profile.first_name, profile.last_name].filter(Boolean).join(' ');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !project?.project_id || !user) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `projects/${project.project_id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const newDocument: ProjectDocument = {
        id: Date.now().toString(),
        name: file.name,
        category: selectedCategory,
        uploadDate: new Date().toISOString().split('T')[0],
        size: formatFileSize(file.size),
        type: fileExt?.toUpperCase() || 'FILE',
        version: 1,
        file_path: filePath,
        uploaded_by: user.user_metadata?.first_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
          : user.email || 'Unknown User'
      };

      const updatedDocuments = [newDocument, ...documents];
      const notesData = { documents: updatedDocuments };

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          notes: JSON.stringify(notesData),
          updated_at: new Date().toISOString()
        })
        .eq('project_id', project.project_id);

      if (updateError) throw updateError;

      const preparers = Array.isArray(project.preparer) ? project.preparer : [];
      const reviewer = project.reviewer ? [project.reviewer] : [];
      const allRecipientEmails = [...preparers, ...reviewer]
        .filter(email => email && email !== user.email);

      if (allRecipientEmails.length > 0) {
        const { data: usersToNotify, error } = await supabase
          .from('profiles')
          .select('id, email')
          .in('email', allRecipientEmails);

        if (usersToNotify && usersToNotify.length > 0) {
          const notifications = usersToNotify.map((recipient) => ({
            user_id: recipient.id,
            title: 'New document uploaded 📁',
            message: `${user.user_metadata?.first_name
              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
              : user.email} has uploaded a new document on ${project.project_name}`,
            is_read: false,
            created_at: new Date().toISOString(),
          }));
          await supabase.from('notifications').insert(notifications);
        }
      }
      const preparerIds = Array.isArray(project.preparer)
        ? project.preparer
        : typeof project.preparer === 'string'
          ? project.preparer.split(',').map(e => e.trim())
          : [];
      const reviewerIds = project.reviewer
        ? (Array.isArray(project.reviewer) ? project.reviewer : [project.reviewer])
        : [];

      const allRecipientIds = [...preparerIds, ...reviewerIds]
        .filter((id, idx, arr) => id && id !== user.id && arr.indexOf(id) === idx);

      if (allRecipientIds.length > 0) {
        const { data: usersToNotify, error: fetchError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', allRecipientIds);

        if (fetchError) {
          console.error('Profile fetch error:', fetchError);
        }

        if (usersToNotify && usersToNotify.length > 0) {
          const notifications = usersToNotify.map((recipient) => ({
            user_id: recipient.id,
            title: 'New document uploaded',
            message: `${user.user_metadata?.first_name
              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
              : user.email} has uploaded a new document on ${project.project_name}`,
            is_read: false,
            created_at: new Date().toISOString(),
          }));

          const { error: insertError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (insertError) {
            console.error('Notification insert error:', insertError.message, insertError.details);
          }
        }
      }
      setDocuments(updatedDocuments);
      event.target.value = '';
    } catch (err) {
      console.error('Error uploading file:', err);
      let errorMessage = 'Failed to upload file';
      if (err instanceof Error) {
        if (err.message.includes('row-level security policy') || err.message.includes('Unauthorized')) {
          errorMessage = 'Upload permission denied. Please contact your administrator to configure storage permissions for the project-documents bucket.';
        } else if (err.message.includes('Bucket not found')) {
          errorMessage = 'Storage bucket not configured. Please contact your administrator to create the project-documents bucket.';
        } else {
          errorMessage = err.message;
        }
      }
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadFile = async (document: ProjectDocument) => {
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('project-documents')
        .download(document.file_path);

      if (downloadError) throw new Error(`Failed to download file: ${downloadError.message}`);

      if (fileData) {
        const blob = new Blob([fileData], { type: document.type || 'application/octet-stream' });
        const blobUrl = URL.createObjectURL(blob);

        if (typeof window !== 'undefined' && window.document) {
          const link = window.document.createElement('a');
          link.href = blobUrl;
          link.download = document.name;
          link.style.display = 'none';
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
        } else {
          window.open(blobUrl, '_blank');
        }
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'bg-red-100 text-red-600';
      case 'doc':
      case 'docx':
        return 'bg-blue-100 text-blue-600';
      case 'xls':
      case 'xlsx':
        return 'bg-green-100 text-green-600';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !project?.project_id || !user) return;

    setIsPostingComment(true);
    try {
      const comment: ProjectComment = {
        id: Date.now().toString(),
        author: user.user_metadata?.first_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
          : user.email || 'Unknown User',
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
        mentions: []
      };

      const updatedComments = [comment, ...comments];

      const { error } = await supabase
        .from('projects')
        .update({
          comments: JSON.stringify(updatedComments),
          updated_at: new Date().toISOString()
        })
        .eq('project_id', project.project_id);

      if (error) throw error;
      // --- Send notification to all preparers and reviewer except commenter ---
      if (project) {
        // Ensure preparers and reviewer are arrays of emails
        const preparerIds = Array.isArray(project.preparer) ? project.preparer : [];
        const reviewerIds = project.reviewer ? [project.reviewer] : [];
        const allRecipientIds = [...preparerIds, ...reviewerIds]
          .filter((id, idx, arr) => id && id !== user.id && arr.indexOf(id) === idx);

        console.log('Sending notifications to:', allRecipientIds);

        if (allRecipientIds.length > 0) {
          const { data: usersToNotify, error: fetchError } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name')
            .in('id', allRecipientIds);

          if (fetchError) {
            console.error('Profile fetch error:', fetchError);
          }
          
          if (usersToNotify && usersToNotify.length > 0) {
            const notifications = usersToNotify.map((recipient) => ({
              user_id: recipient.id,
              title: `New comment on ${project.project_name} 📜`,
              message: `${user.user_metadata?.first_name
                ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
                : user.email} sent a comment about the project`,
              is_read: false,
              created_at: new Date().toISOString(),
            }));
            const { error: insertError } = await supabase.from('notifications').insert(notifications);
            if (insertError) {
              console.error('Notification insert error:', insertError);
            }
          }
        }
      }
      // --- End notification logic ---
      
      setComments(updatedComments);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const formatCommentDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleUpdateOverallStatus = async () => {
  if (!project || !pendingStatus) return;
  setIsUpdatingStatus(true);
  setStatusUpdateError(null);
  try {
    const updateObj: any = {
      status: pendingStatus,
      updated_at: new Date().toISOString(),
      last_modified_by: user?.email || 'Unknown User',
      to_do_or_update:
        pendingStatus === 'To Do' || pendingStatus === 'staff to update'
          ? todoOrUpdateNote
          : null,
    };

    const { error } = await supabase
      .from('projects')
      .update(updateObj)
      .eq('project_id', project.project_id);

    if (error) throw error;

    // --- Send notification to all preparers and reviewer except updater ---
    if (project) {
      // Collect all user emails/names for preparers and reviewer
      const preparerIds = Array.isArray(project.preparer) ? project.preparer : [];
      const reviewerIds = project.reviewer ? [project.reviewer] : [];
      const allRecipientIds = [...preparerIds, ...reviewerIds]
        .filter((id, idx, arr) => id && id !== user.id && arr.indexOf(id) === idx);

      // Fetch user IDs for these names (assuming names are unique, or you may want to use emails if available)
      if (allRecipientIds.length > 0) {
        const { data: usersToNotify, error: fetchError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', allRecipientIds);

        if (usersToNotify && usersToNotify.length > 0) {
          const notifications = usersToNotify.map((recipient) => ({
            user_id: recipient.id,
            title: `[${project.project_name}] status update 💡`,
            message: `${user?.user_metadata?.first_name
              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
              : user?.email || 'Unknown User'} has updated the status to ${pendingStatus}`,
            is_read: false,
            created_at: new Date().toISOString(),
          }));
          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
          }
        }
      }
    }
    // --- End notification logic ---
    await refetch();
    setPendingStatus(null);
  } catch (err: any) {
    console.error('Error updating overall status:', err);
    setStatusUpdateError(err?.message || 'Failed to update status');
  } finally {
    setIsUpdatingStatus(false);
  }
};

  const toggleLockdown = async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from('projects')
      .update({ is_locked: !isLocked })
      .eq('project_id', parseInt(projectId))
      .select('is_locked')
      .single();

    if (error) {
      console.error('Error updating lockdown state:', error);
      return;
    }

    setIsLocked(data.is_locked);
    refetch();
  };

  const toggleStatusDropdown = (statusType: 'client' | 'preparer' | 'reviewer') => {
    setShowStatusDropdowns(prev => ({
      client: false,
      preparer: false,
      reviewer: false,
      [statusType]: !prev[statusType]
    }));
  };

  const getStatusColor = (type: 'client' | 'preparer' | 'reviewer', status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('completed') || lowerStatus.includes('approved')) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (lowerStatus.includes('wip') || lowerStatus.includes('reviewing')) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    } else if (lowerStatus.includes('not started')) {
      return 'text-gray-600 bg-gray-50 border-gray-200';
    } else {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  
  if (loading) {
    return (
      <div className="flex-1 p-8 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-gray-600">Loading project...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex-1 p-8 bg-gray-50">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Projects</span>
        </button>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertCircle size={24} />
            <span>Error loading project: {error || 'Project not found'}</span>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('completed')) return 'bg-green-600 text-white';
  if (s.includes('wip') || s.includes('work in progress')) return 'bg-blue-600 text-white';
  if (s.includes('to do') || s.includes('not start')) return 'bg-indigo-600 text-white';
  if (s.includes('reviewer') || s.includes('ready for reviewer') || s.includes('ready for final review')) return 'bg-purple-600 text-white';
  if (s.includes('reviewed')) return 'bg-orange-500 text-white';
  if (s.includes('client review') || s.includes('for client') || s.includes('for client review')) return 'bg-yellow-500 text-white';
  if (s.includes('to efile') || s.includes('efile')) return 'bg-teal-600 text-white';
  if (s.includes('staff to update')) return 'bg-gray-600 text-white';
  return 'bg-gray-400 text-white';
};

  const canEditInvoice = userProfile?.role === 'Admin' || userProfile?.role === 'Partner' || userProfile?.role === 'Dev';
  const canLockProject = userProfile?.role === 'Dev' || userProfile?.role === 'Partner';
  const handleProjectUpdated = () => {
    refetch();
  };

  const handleArchiveProject = async () => {
    if (!project) return;

    setIsArchiving(true);
    setArchiveError(null);

    try {
      const updateData: any = {
        status: 'Completed',
        updated_at: new Date().toISOString(),
        date_completed: new Date().toISOString().split('T')[0],
        client_status: 'Completed',
        preparer_status: 'Completed',
        reviewer_status: 'Approved',
        archived_at: new Date().toISOString().split('T')[0],
      };

      const { error: updateError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('project_id', project.project_id);

      if (updateError) throw updateError;

      setShowArchiveModal(false);
      onBack();
    } catch (err) {
      console.error('Error archiving project:', err);
      setArchiveError(err instanceof Error ? err.message : 'Failed to archive project');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleEditProject = () => {
    setIsEditModalOpen(true);
  };

  const handleEditInvoice = () => {
    setIsInvoiceEditModalOpen(true);
  };

  const handleCloseInvoiceEditModal = () => {
    setIsInvoiceEditModalOpen(false);
    setInvoiceUpdateError(null);
  };

  const handleInvoiceFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoiceFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingInvoice(true);
    setInvoiceUpdateError(null);

    try {
      const invoiceData = {
        invoice_number: invoiceFormData.invoice_number.trim() || null,
        amount: invoiceFormData.amount ? parseFloat(invoiceFormData.amount) : null,
        hst_amount: invoiceFormData.hst_amount ? parseFloat(invoiceFormData.hst_amount) : null,
        amount_received: invoiceFormData.amount_received ? parseFloat(invoiceFormData.amount_received) : null,
        approximated_actual_time_used: invoiceFormData.approximated_actual_time_used ? parseFloat(invoiceFormData.approximated_actual_time_used) : null,
        date_of_efile_mail: invoiceFormData.date_of_efile_mail?.trim() || null,
        last_modified_by: user?.email || 'Unknown User',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('projects')
        .update(invoiceData)
        .eq('project_id', project?.project_id);

      if (error) throw error;

      refetch();
      setIsInvoiceEditModalOpen(false);
    } catch (err) {
      console.error('Error updating invoice:', err);
      setInvoiceUpdateError(err instanceof Error ? err.message : 'Failed to update invoice');
    } finally {
      setIsUpdatingInvoice(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleStartProject = async () => {
    if (!project) return;

    setIsStarting(true);
    setStartError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          date_in: today,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', project.project_id);

      if (updateError) throw updateError;

      setShowStartModal(false);
      refetch();
    } catch (err) {
      console.error('Error starting project:', err);
      setStartError(err instanceof Error ? err.message : 'Failed to start project');
    } finally {
      setIsStarting(false);
    }
  };

  const handleFinishProject = async () => {
    if (!project) return;

    setIsFinishing(true);
    setFinishError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          date_completed: today,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', project.project_id);

      if (updateError) throw updateError;

      setShowFinishModal(false);
      refetch();
    } catch (err) {
      console.error('Error finishing project:', err);
      setFinishError(err instanceof Error ? err.message : 'Failed to finish project');
    } finally {
      setIsFinishing(false);
    }
  };

  const calculateProgress = () => {
    if (!project.date_in || !project.due_date) return 0;
    const dateIn = new Date(project.date_in);
    const dueDate = new Date(project.due_date);
    const today = new Date();
    const totalDays = (dueDate.getTime() - dateIn.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - dateIn.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
  };

  const tabs = [
    { id: 'details', label: 'Project Details' },
    { id: 'workflow', label: 'Workflow & Status' },
    { id: 'contact', label: 'Client Contact Info' },
    { id: 'documents', label: 'Documents' },
    { id: 'comments', label: 'Comments & Notes' }
  ];

  return (
    <div className="flex-1 p-8 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Projects</span>
          </button>
          {canLockProject && (
            <button
              onClick={toggleLockdown}
              className={`px-4 py-2 rounded-lg shadow ml-4 
                ${isLocked ? 'bg-green-800 hover:bg-green-900 border border-green-900'
        : 'bg-[#4d9837] hover:bg-green-700 border border-green-800'}
      text-white flex items-center transition-colors`}
            >
              <Lock size={16} className="mr-2" />
              {isLocked ? 'Project Locked' : 'Lockdown Project'}
            </button>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.project_name || 'Untitled Project'}</h1>
              <p className="text-xl text-gray-600">{[
                project.client?.title,
                project.client?.first_name,
                project.client?.middle_name,
                project.client?.last_name
              ]
                .filter(Boolean)
                .join(' ')} • {project.engagement_type || 'No engagement type'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeColor(project.status || '')}`}>
                {project.status}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleEditProject}
              className="flex items-center space-x-2 px-4 py-2 bg-[#4d9837] text-white rounded-lg hover:bg-[#3d7a2a] transition-colors"
              disabled={isLocked}
            >
              <Edit size={16} />
              <span>Edit Project</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setExportOpen(prev => !prev)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#e6f4ea] text-[#4d9837] rounded-lg hover:bg-[#cbead3] transition-colors"
                disabled={isLocked}
                type="button"
              >
                <Download size={16} />
                <span>Export</span>
                <ChevronDown size={16} className="text-[#4d9837]" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    type="button"
                    onClick={() => { handleExportCSV(); setExportOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FileText size={14} />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handlePrintPDF(); setExportOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Printer size={14} />
                    <span>Print / Save as PDF</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4 ml-auto">
              <button
                onClick={() => setShowArchiveModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#e6f4ea] text-[#4d9837] rounded-lg hover:bg-[#cbead3] transition-colors"
                disabled={isLocked}
              >
                <Archive size={16} />
                <span>Archive</span>
              </button>
              {!project.date_in ? (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#e6f4ea] text-[#4d9837] rounded-lg hover:bg-[#cbead3] transition-colors"
                  disabled={isLocked}
                >
                  <Play size={16} />
                  <span>Start</span>
                </button>
              ) : !project.date_completed ? (
                <button
                  onClick={() => setShowFinishModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#e6f4ea] text-[#4d9837] rounded-lg hover:bg-[#cbead3] transition-colors"
                  disabled={isLocked}
                >
                  <CheckCircle size={16} />
                  <span>Finish</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="text-[#4d9837]" size={24} />
            <h3 className="font-semibold text-gray-900">Due Date</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{project.due_date || 'Not set'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="text-[#4d9837]" size={24} />
            <h3 className="font-semibold text-gray-900">Progress</h3>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Date In: {project.date_in || 'Not set'}</span>
              <span>Due: {project.due_date || 'Not set'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-600">{Math.round(calculateProgress())}% Complete</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <DollarSign className="text-[#4d9837]" size={24} />
            <h3 className="font-semibold text-gray-900">Fees</h3>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Estimated: ${(project.estimated_fees || 0).toLocaleString()}</span>
              <span>Invoice: ${(project.amount || 0).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.estimated_fees ? Math.min(((project.amount || 0) / project.estimated_fees) * 100, 100) : 0}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {(project.amount || 0) > (project.estimated_fees || 0) ? 'Over' : 'Under'} Budget
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            {project.outstandingBalance > 0 ? (
              <AlertCircle className="text-red-600" size={24} />
            ) : (
              <CheckCircle className="text-[#4d9837]" size={24} />
            )}
            <h3 className="font-semibold text-gray-900">Outstanding</h3>
          </div>
          <p className={`text-2xl font-bold ${project.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${project.outstandingBalance.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            {project.outstandingBalance > 0 ? 'Payment Due' : 'Paid in Full'}
          </p>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Engagement Type</label>
                      <p className="text-gray-900">{project.engagement_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client Partner</label>
                      <p className="text-gray-900">{project.client_partners || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Year-End Date</label>
                      <p className="text-gray-900">{project.year_end || 'Not set'}</p>
                    </div>
                    {project.date_in && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date In</label>
                        <p className="text-gray-900">{project.date_in}</p>
                      </div>
                    )}
                    {project.date_completed && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date Completed</label>
                        <p className="text-gray-900">{project.date_completed}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Required</h3>
                  {project.services_required ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Selected Services</label>
                      <div className="space-y-3">
                        {Object.entries(project.services_required as Record<string, string[]>).map(([category, services]) => (
                          <div key={category} className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                            <div className="flex flex-wrap gap-2">
                              {services.map((service) => (
                                <span
                                  key={service}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#4d9837] text-white"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Services</label>
                      <p className="text-gray-600">No services specified</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preparer</label>
                      <p className="text-gray-900">
                        {Array.isArray(project.preparer) && project.preparer.length > 0
                          ? project.preparer
                              .map((id: string) => {
                                const member = staff.find(s => s.id === id);
                                return member ? getStaffDisplayName(member) : id;
                              })
                              .join(', ')
                          : 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reviewer</label>
                      <p className="text-gray-900">
                        {project.reviewer
                          ? (() => {
                              const reviewerProfile = staff.find(s => s.id === project.reviewer);
                              return reviewerProfile
                                ? getStaffDisplayName(reviewerProfile)
                                : project.reviewer;
                            })()
                          : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Tracking</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <div className="relative">
                        <select
                          value={pendingStatus !== null ? pendingStatus : (project.status || '')}
                          onChange={(e) => handleStatusSelect(e.target.value)}
                          disabled={isLocked || isUpdatingStatus}
                          className="px-3 py-1 rounded-full text-sm border border-gray-300 focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                        >
                          <option value="">Select status</option>
                          {statusOptions.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Show note input if "To do" or "staff to update" is selected */}
                    {(pendingStatus === 'To Do' || pendingStatus === 'staff to update' ||
                      (pendingStatus === null && (project.status === 'To Do' || project.status === 'staff to update'))
                    ) && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {pendingStatus === 'To Do' || (pendingStatus === null && project.status === 'To Do')
                            ? 'To Do Note'
                            : 'Staff Update Note'}
                        </label>
                        <input
                          type="text"
                          value={todoOrUpdateNote}
                          onChange={e => setTodoOrUpdateNote(e.target.value)}
                          disabled={isLocked || isUpdatingStatus || isLoadingTodoOrUpdate}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                          placeholder="Enter note..."
                        />
                      </div>
                    )}
                    {pendingStatus !== null && pendingStatus !== project.status && (
                      <button
                        onClick={handleUpdateOverallStatus}
                        disabled={isUpdatingStatus}
                        className="mt-4 px-4 py-2 bg-[#4d9837] text-white rounded-lg hover:bg-[#3d7a2a] transition-colors font-medium"
                      >
                        {isUpdatingStatus ? 'Updating...' : 'Update'}
                      </button>
                    )}
                    {statusUpdateError && (
                      <div className="mt-3 text-sm text-red-600">{statusUpdateError}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">
  {[
    project.client?.title,
    project.client?.first_name,
    project.client?.middle_name,
    project.client?.last_name
  ]
    .filter(Boolean) // removes undefined or null values
    .join(' ')}
</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <p className="text-gray-900">{project.client?.company || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{project.client?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{project.client?.phone_numbers || project.client?.mobile || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Addresses</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Billing Address</label>
                      <p className="text-gray-900 whitespace-pre-line">{project.client?.bill_address || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
                      <p className="text-gray-900 whitespace-pre-line">{project.client?.ship_address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Project Documents</h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ProjectDocument['category'])}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  >
                    <option value="Source Docs">Source Docs</option>
                    <option value="Working Papers">Working Papers</option>
                    <option value="Final Returns">Final Returns</option>
                    <option value="Client Correspondence">Client Correspondence</option>
                  </select>
                  <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    <Upload size={16} />
                    <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={isUploading || isLocked}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    />
                  </label>
                </div>
              </div>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm font-medium">{uploadError}</p>
                </div>
              )}

              {isUploading && (
                <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-8 text-center">
                  <Loader2 className="mx-auto h-12 w-12 text-blue-600 mb-4 animate-spin" />
                  <p className="text-blue-600 mb-2">Uploading document...</p>
                  <p className="text-sm text-blue-500">Please wait while your file is being uploaded</p>
                </div>
              )}

              {!isUploading && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Click "Upload Document" to add files</p>
                  <p className="text-sm text-gray-500">Supports PDF, DOC, XLS, and image files</p>
                </div>
              )}

              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-gray-600">Loading documents...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No documents uploaded yet. Upload your first document!</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileIcon(doc.type)}`}>
                            <span className="font-semibold text-xs">{doc.type}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-sm text-gray-500">
                              {doc.category} • {doc.size} • v{doc.version} • {doc.uploadDate}
                            </p>
                            <p className="text-xs text-gray-400">
                              Uploaded by {doc.uploaded_by}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                         {/* <button 
                            onClick={() => handlePreviewFile(doc)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            <Eye size={14} />
                            <span>Preview</span>
                          </button> */}
                          <button 
                            onClick={() => handleDownloadFile(doc)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Comments & Notes</h3>
              
              <div className="space-y-4">
                <div className="border border-gray-300 rounded-lg p-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment... Use @username to mention team members"
                    className="w-full h-24 border-0 resize-none focus:ring-0 focus:outline-none placeholder-gray-400"
                    disabled={isPostingComment}
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={handlePostComment}
                      disabled={!newComment.trim() || isPostingComment || isLocked}
                      className="px-4 py-2 bg-[#4d9837] hover:bg-[#3d7a2a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      {isPostingComment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Posting...</span>
                        </>
                      ) : (
                        <span>Post Comment</span>
                      )}
                    </button>
                  </div>
                </div>

                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-gray-600">Loading comments...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No comments yet. Be the first to add one!</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-[#4d9837] rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {comment.author.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{comment.author}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Activity Log</h4>
                
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Information Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Information</h3>
            {canEditInvoice && (
              <button
                onClick={handleEditInvoice}
                className="flex items-center space-x-2 px-3 py-2 bg-[#4d9837] text-white rounded-lg hover:bg-[#3d7a2a] transition-colors text-sm"
                disabled={isLocked}
              >
                <Edit size={16} />
                <span>Edit Invoice</span>
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {/* Invoice Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <p className="text-gray-900">{project.invoice_number || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Amount</label>
                  <p className="text-gray-900">${(project.amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HST Amount</label>
                  <p className="text-gray-900">${(project.hst_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount Received</label>
                  <p className="text-gray-900">${(project.amount_received || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Time & Completion */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Time & Completion</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual Time Used</label>
                  <p className="text-gray-900">{project.approximated_actual_time_used || 0} hours</p>
                </div>
                {project.date_completed && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date Completed</label>
                    <p className="text-gray-900">{project.date_completed}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Efile</label>
                  <p className="text-gray-900">{project.date_of_efile_mail || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Archive Project</h3>
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={isArchiving}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Archive className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Archive this project?</h4>
                  <p className="text-sm text-gray-600">This will move the project to archived projects.</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Project:</span> {project?.project_name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Client:</span> {project?.clientName}
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                The project will be marked as completed and moved to the archived projects list. 
                You can still access it later if needed.
              </p>

              {archiveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm font-medium">{archiveError}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={isArchiving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveProject}
                disabled={isArchiving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isArchiving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Archiving...</span>
                  </>
                ) : (
                  <>
                    <Archive size={16} />
                    <span>Archive Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Project Confirmation Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Finish Project</h3>
              <button
                onClick={() => setShowFinishModal(false)}
                disabled={isFinishing}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Ready to finish this project?</h4>
                  <p className="text-sm text-gray-600">This will mark the project as completed.</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Project:</span> {project?.project_name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Client:</span> {project?.clientName}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Date Completed:</span> {new Date().toLocaleDateString()} (Today)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-800 text-sm">
                  <span className="font-medium">Note:</span> Finishing this project will set today's date as the "Date Completed".
                </p>
              </div>

              {finishError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm font-medium">{finishError}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowFinishModal(false)}
                disabled={isFinishing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFinishProject}
                disabled={isFinishing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Finishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Finish Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {project && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onProjectUpdated={handleProjectUpdated}
          project={project}
        />
      )}

      {/* Start Project Confirmation Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Start Project</h3>
              <button
                onClick={() => setShowStartModal(false)}
                disabled={isStarting}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Ready to start this project?</h4>
                  <p className="text-sm text-gray-600">This will set today's date as the "Date In".</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Project:</span> {project?.project_name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Client:</span> {project?.clientName}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Date In:</span> {new Date().toLocaleDateString()} (Today)
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 text-sm">
                  <span className="font-medium">Note:</span> Starting this project will set today's date as the "Date In".
                </p>
              </div>

              {startError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm font-medium">{startError}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowStartModal(false)}
                disabled={isStarting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStartProject}
                disabled={isStarting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Start Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Edit Modal */}
      {isInvoiceEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit Invoice Information</h2>
              <button
                onClick={handleCloseInvoiceEditModal}
                disabled={isUpdatingInvoice}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateInvoice} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Invoice Number */}
                <div>
                  <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    id="invoice_number"
                    name="invoice_number"
                    value={invoiceFormData.invoice_number}
                    onChange={handleInvoiceFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                    placeholder="Enter invoice number"
                  />
                </div>
                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="amount"
                    name="amount"
                    value={invoiceFormData.amount}
                    onChange={handleInvoiceFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                {/* HST Amount */}
                <div>
                  <label htmlFor="hst_amount" className="block text-sm font-medium text-gray-700 mb-2">
                    HST Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="hst_amount"
                    name="hst_amount"
                    value={invoiceFormData.hst_amount}
                    onChange={handleInvoiceFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                {/* Amount Received */}
                <div>
                  <label htmlFor="amount_received" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Received ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="amount_received"
                    name="amount_received"
                    value={invoiceFormData.amount_received}
                    onChange={handleInvoiceFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                {/* Actual Time Used */}
                <div>
                  <label htmlFor="approximated_actual_time_used" className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Time Used (hours)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="approximated_actual_time_used"
                    name="approximated_actual_time_used"
                    value={invoiceFormData.approximated_actual_time_used}
                    onChange={handleInvoiceFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Date of Efile */}
                <div>
                  <label htmlFor="date_of_efile_mail" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Efile
                  </label>
                  <input
                    type="date"
                    id="date_of_efile_mail"
                    name="date_of_efile_mail"
                    value={invoiceFormData.date_of_efile_mail}
                    onChange={handleInvoiceFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  />
                </div>
              </div>
              {/* Error Message */}
              {invoiceUpdateError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm font-medium">{invoiceUpdateError}</p>
                </div>
              )}
              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseInvoiceEditModal}
                  disabled={isUpdatingInvoice}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingInvoice}
                  className="px-6 py-2 bg-[#4d9837] hover:bg-[#3d7a2a] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isUpdatingInvoice ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Invoice</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ProjectOverview;