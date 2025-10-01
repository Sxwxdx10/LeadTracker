'use client';

import React, { useState } from 'react';
import { 
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Comment } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/utils';

interface CommentSectionProps {
  comments: Comment[];
  leadId: string;
  isLoading?: boolean;
  onCreateComment?: (content: string) => void;
  onUpdateComment?: (id: string, content: string) => void;
  onDeleteComment?: (id: string) => void;
}

export function CommentSection({ 
  comments, 
  leadId, 
  isLoading, 
  onCreateComment, 
  onUpdateComment, 
  onDeleteComment 
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmitComment = () => {
    if (newComment.trim() && onCreateComment) {
      onCreateComment(newComment.trim());
      setNewComment('');
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (editContent.trim() && onUpdateComment) {
      onUpdateComment(commentId, editContent.trim());
      setEditingComment(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleDeleteComment = (comment: Comment) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      if (onDeleteComment) {
        onDeleteComment(comment.id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Comment form skeleton */}
        <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
          <div className="h-20 bg-gray-200 rounded mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        
        {/* Comments skeleton */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">
          Notes et commentaires ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="space-y-3">
          <Textarea
            placeholder="Ajouter un commentaire ou une note..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="flex items-center gap-2"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Aucun commentaire
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Ajoutez le premier commentaire pour ce lead.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {comment.user.fullName}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatDateTime(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditComment(comment)}
                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteComment(comment)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 ml-11">
                {editingComment === comment.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        Sauvegarder
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                )}
              </div>
              
              {comment.updatedAt !== comment.createdAt && (
                <div className="mt-2 ml-11 text-xs text-gray-500">
                  Modifié le {formatDateTime(comment.updatedAt)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
