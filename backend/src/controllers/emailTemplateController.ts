import { Request, Response } from 'express';
import mongoose from 'mongoose';
import EmailTemplate from '../models/EmailTemplate';
import { IEmailTemplate } from '../models/EmailTemplate';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export const createTemplate = async (req: any, res: Response) => {
  try {
    const { name, subject, body, variables = [], attachments = [] } = req.body;

    const exists = await EmailTemplate.findOne({ name, user: req.user?.id });
    if (exists)
      return res.status(400).json({ error: 'Template name already exists.' });

    const newTemplate: IEmailTemplate = new EmailTemplate({
      name,
      subject,
      body,
      variables,
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    await newTemplate.save();
    return res.status(201).json({});
  } catch (error) {
    return res.status(500).json({ error: 'Server Error' });
  }
};

export const getTemplates = async (req: any, res: Response) => {
  try {
    const templates = await EmailTemplate.find({
      userId: new mongoose.Types.ObjectId(req.user.id),
    }).sort({
      updatedAt: -1,
    });
    return res.status(200).json({ templates });
  } catch (error) {
    return res.status(500).json({ error: 'Server Error' });
  }
};

export const getTemplateById = async (req: any, res: Response) => {
  try {
    const template = await EmailTemplate.findOne({
      _id: req.body.id,
      userId: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

export const updateTemplate = async (req: any, res: Response) => {
  try {
    const { name, subject, body, variables, attachments } = req.body;

    const existing = await EmailTemplate.findOne({
      _id: req.body.id,
      userId: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    if (name && name !== existing.name) {
      const nameExists = await EmailTemplate.findOne({
        name,
        userId: new mongoose.Types.ObjectId(req.user.id),
      });
      if (nameExists)
        return res
          .status(400)
          .json({ error: 'Another template with this name exists' });
      existing.name = name;
    }

    if (subject) existing.subject = subject;
    if (body) existing.body = body;
    if (Array.isArray(variables)) existing.variables = variables;

    await existing.save();
    res.json(existing);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

export const deleteTemplate = async (req: any, res: Response) => {
  try {
    const deleted = await EmailTemplate.findOneAndDelete({
      _id: req.body.id,
      user: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!deleted) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
