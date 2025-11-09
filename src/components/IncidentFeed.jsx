import React from 'react';
import { Card, List, ListItem, Badge, Title } from '@tremor/react';
import {
  ShieldExclamationIcon,
  HeartIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { ReportCategory, ReportStatus } from '../types.js';

const categoryConfig = {
  [ReportCategory.SECURITY]: { icon: ShieldExclamationIcon, color: 'red' },
  [ReportCategory.HEALTH]: { icon: HeartIcon, color: 'pink' },
  [ReportCategory.CROWD]: { icon: UsersIcon, color: 'yellow' },
  [ReportCategory.LOST_FOUND]: { icon: MagnifyingGlassIcon, color: 'blue' },
  [ReportCategory.FACILITY]: { icon: WrenchScrewdriverIcon, color: 'indigo' },
  [ReportCategory.OTHER]: { icon: QuestionMarkCircleIcon, color: 'gray' },
};

const statusConfig = {
  [ReportStatus.PENDING]: { color: 'yellow' },
  [ReportStatus.IN_PROGRESS]: { color: 'blue' },
  [ReportStatus.RESOLVED]: { color: 'green' },
  [ReportStatus.CLOSED]: { color: 'gray' },
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

const IncidentFeed = ({ reports, onIncidentSelect }) => {
  return (
    <Card className="h-full flex flex-col">
      <Title>Live Incident Feed</Title>
      <div className="flex-grow overflow-y-auto mt-4 pr-1">
        <List>
          {reports.map((report) => {
            const config = categoryConfig[report.category] || categoryConfig.OTHER;
            const status = statusConfig[report.status] || statusConfig.CLOSED;
            const Icon = config.icon;

            return (
              <ListItem 
                key={report.id} 
                className="cursor-pointer hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted rounded-tremor-default"
                onClick={() => onIncidentSelect(report)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`mt-1 p-2 rounded-full bg-${config.color}-500/20`}>
                    <Icon className={`h-6 w-6 text-${config.color}-500`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-medium">{report.description}</p>
                    <p className="text-tremor-content dark:text-dark-tremor-content text-sm">
                      Reported by {report.reporterName} • {timeAgo(report.createdAt)}
                    </p>
                  </div>
                  <Badge color={status.color}>{report.status.replace('_', ' ').toLowerCase()}</Badge>
                </div>
              </ListItem>
            );
          })}
        </List>
      </div>
    </Card>
  );
};

export default IncidentFeed;