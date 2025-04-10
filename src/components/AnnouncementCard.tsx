import React from 'react';
import { format } from 'date-fns';
import '../styles/cards.css';

interface AnnouncementCardProps {
  title: string;
  content: string;
  author: string;
  date: string;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  title,
  content,
  author,
  date,
}) => {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <p className="card-content">{content}</p>
      <div className="card-meta">
        <span className="card-author">By {author}</span>
        <span className="card-date">
          {' '}
          • {format(new Date(date), 'MMM d, yyyy')}
        </span>
      </div>
    </div>
  );
};

export default AnnouncementCard; 