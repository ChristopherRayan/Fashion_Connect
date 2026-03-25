import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { Complaint } from '../../models/complaint.model.js';
import { Notification } from '../../models/notification.model.js';
import { User } from '../../models/user.model.js';

// Create a new complaint (CLIENT and DESIGNER)
export const createComplaint = asyncHandler(async (req, res) => {
  const { subject, description, category, priority, relatedOrder, relatedProduct, relatedDesigner } = req.body;
  const userId = req.user._id;

  if (!subject || !description || !category) {
    throw new ApiError(400, "Subject, description, and category are required");
  }

  const complaint = await Complaint.create({
    user: userId,
    subject: subject.trim(),
    description: description.trim(),
    category,
    priority: priority || 'medium',
    relatedOrder,
    relatedProduct,
    relatedDesigner
  });

  const populatedComplaint = await Complaint.findById(complaint._id)
    .populate('user', 'name email')
    .populate('relatedOrder', 'orderNumber')
    .populate('relatedProduct', 'name')
    .populate('relatedDesigner', 'name businessName');

  return res.status(201).json(
    new ApiResponse(201, populatedComplaint, "Complaint submitted successfully")
  );
});

// Get user's complaints (CLIENT only)
export const getUserComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, category, sortBy = 'createdAt', sortType = 'desc' } = req.query;
  const userId = req.user._id;

  const query = { user: userId };
  if (status) query.status = status;
  if (category) query.category = category;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
    populate: [
      { path: 'adminUser', select: 'name' },
      { path: 'relatedOrder', select: 'orderNumber' },
      { path: 'relatedProduct', select: 'name' },
      { path: 'relatedDesigner', select: 'name businessName' }
    ]
  };

  const complaints = await Complaint.paginate(query, options);
  return res.status(200).json(
    new ApiResponse(200, complaints, "User complaints fetched successfully")
  );
});

// Get all complaints (ADMIN only)
export const getAllComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category, priority, sortBy = 'createdAt', sortType = 'desc' } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
    populate: [
      { path: 'user', select: 'name email' },
      { path: 'adminUser', select: 'name' },
      { path: 'relatedOrder', select: 'orderNumber' },
      { path: 'relatedProduct', select: 'name' },
      { path: 'relatedDesigner', select: 'name businessName' }
    ]
  };

  const complaints = await Complaint.paginate(query, options);
  return res.status(200).json(
    new ApiResponse(200, complaints, "All complaints fetched successfully")
  );
});

// Get complaint by ID
export const getComplaintById = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;

  const complaint = await Complaint.findById(complaintId)
    .populate('user', 'name email')
    .populate('adminUser', 'name')
    .populate('relatedOrder', 'orderNumber totalAmount')
    .populate('relatedProduct', 'name images')
    .populate('relatedDesigner', 'name businessName');

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Check if user is authorized to view this complaint
  if (req.user.role !== 'ADMIN' && complaint.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to view this complaint");
  }

  return res.status(200).json(
    new ApiResponse(200, complaint, "Complaint details fetched successfully")
  );
});

// Update complaint status and add admin response (ADMIN only)
export const updateComplaint = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;
  const { status, adminResponse } = req.body;
  const adminUserId = req.user._id;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Update fields
  if (status) complaint.status = status;
  if (adminResponse) {
    complaint.adminResponse = adminResponse.trim();
    complaint.adminUser = adminUserId;
  }

  await complaint.save();

  const updatedComplaint = await Complaint.findById(complaintId)
    .populate('user', 'name email')
    .populate('adminUser', 'name')
    .populate('relatedOrder', 'orderNumber')
    .populate('relatedProduct', 'name')
    .populate('relatedDesigner', 'name businessName');

  return res.status(200).json(
    new ApiResponse(200, updatedComplaint, "Complaint updated successfully")
  );
});

// Get complaint statistics (ADMIN only)
export const getComplaintStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: 'open' }),
    Complaint.countDocuments({ status: 'in_progress' }),
    Complaint.countDocuments({ status: 'resolved' }),
    Complaint.countDocuments({ status: 'closed' }),
    Complaint.countDocuments({ priority: 'urgent' }),
    Complaint.countDocuments({ priority: 'high' })
  ]);

  const [total, open, inProgress, resolved, closed, urgent, high] = stats;

  return res.status(200).json(
    new ApiResponse(200, {
      total,
      open,
      inProgress,
      resolved,
      closed,
      urgent,
      high,
      pending: open + inProgress
    }, "Complaint statistics fetched successfully")
  );
});

// Delete complaint (ADMIN only)
export const deleteComplaint = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  await Complaint.findByIdAndDelete(complaintId);

  return res.status(200).json(
    new ApiResponse(200, null, "Complaint deleted successfully")
  );
});

// Add admin response to complaint (ADMIN only)
export const addAdminResponse = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;
  const { message, isInternal = false, attachments = [] } = req.body;
  const adminUserId = req.user._id;

  if (!message || !message.trim()) {
    throw new ApiError(400, "Response message is required");
  }

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Add the response using the model method
  await complaint.addResponse(adminUserId, message, isInternal, attachments);

  // Create notification for user if response is not internal
  if (!isInternal) {
    await Notification.create({
      recipient: complaint.user,
      type: 'COMPLAINT_RESPONSE',
      title: 'Response to Your Report',
      message: `An admin has responded to your complaint: "${complaint.subject}"`,
      data: {
        complaintId: complaint._id
      },
      actionUrl: `/client/reports/${complaint._id}`,
      priority: 'MEDIUM'
    });
  }

  // Get updated complaint with populated responses
  const updatedComplaint = await Complaint.findById(complaintId)
    .populate('user', 'name email')
    .populate('responses.adminUser', 'name')
    .populate('relatedOrder', 'orderNumber')
    .populate('relatedProduct', 'name')
    .populate('relatedDesigner', 'name businessName');

  return res.status(200).json(
    new ApiResponse(200, updatedComplaint, "Response added successfully")
  );
});

// Get complaint responses (for detailed view)
export const getComplaintResponses = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;
  const isAdmin = req.user.role === 'ADMIN';

  const complaint = await Complaint.findById(complaintId)
    .populate('user', 'name email')
    .populate('responses.adminUser', 'name')
    .populate('relatedOrder', 'orderNumber')
    .populate('relatedProduct', 'name')
    .populate('relatedDesigner', 'name businessName');

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Check authorization
  if (!isAdmin && complaint.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to view this complaint");
  }

  // Filter responses based on user role
  const responses = isAdmin
    ? complaint.responses
    : complaint.responses.filter(response => !response.isInternal);

  // Mark as viewed by user if not admin
  if (!isAdmin) {
    await complaint.markUserViewed();
  }

  return res.status(200).json(
    new ApiResponse(200, {
      ...complaint.toObject(),
      responses,
      hasUnreadResponses: !isAdmin ? complaint.hasUnreadResponses() : false
    }, "Complaint responses fetched successfully")
  );
});

// Mark complaint as escalated (ADMIN only)
export const escalateComplaint = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;
  const { reason } = req.body;
  const adminUserId = req.user._id;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  if (complaint.escalated) {
    throw new ApiError(400, "Complaint is already escalated");
  }

  // Escalate the complaint
  await complaint.escalate(adminUserId);

  // Add internal note about escalation
  if (reason) {
    await complaint.addResponse(
      adminUserId,
      `Complaint escalated. Reason: ${reason}`,
      true // Internal note
    );
  }

  // Create notification for user
  await Notification.create({
    recipient: complaint.user,
    type: 'COMPLAINT_ESCALATED',
    title: 'Your Report Has Been Escalated',
    message: `Your complaint "${complaint.subject}" has been escalated for priority handling.`,
    data: {
      complaintId: complaint._id
    },
    actionUrl: `/client/reports/${complaint._id}`,
    priority: 'HIGH'
  });

  const updatedComplaint = await Complaint.findById(complaintId)
    .populate('user', 'name email')
    .populate('escalatedBy', 'name')
    .populate('responses.adminUser', 'name');

  return res.status(200).json(
    new ApiResponse(200, updatedComplaint, "Complaint escalated successfully")
  );
});

// Get user's complaints with response status (CLIENT only)
export const getUserComplaintsWithStatus = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, category, sortBy = 'createdAt', sortType = 'desc' } = req.query;
  const userId = req.user._id;

  const query = { user: userId };
  if (status) query.status = status;
  if (category) query.category = category;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
    populate: [
      { path: 'responses.adminUser', select: 'name' },
      { path: 'relatedOrder', select: 'orderNumber' },
      { path: 'relatedProduct', select: 'name' },
      { path: 'relatedDesigner', select: 'name businessName' }
    ]
  };

  const result = await Complaint.paginate(query, options);

  // Add response status to each complaint
  const complaintsWithStatus = result.docs.map(complaint => ({
    ...complaint.toObject(),
    publicResponses: complaint.getPublicResponses(),
    hasUnreadResponses: complaint.hasUnreadResponses(),
    responseCount: complaint.getPublicResponses().length
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      ...result,
      docs: complaintsWithStatus
    }, "User complaints with status fetched successfully")
  );
});
