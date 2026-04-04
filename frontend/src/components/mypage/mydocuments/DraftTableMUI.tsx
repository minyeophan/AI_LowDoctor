import { useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { mockDrafts, categoryInfo } from '../../../mock/mockDocuments';
import DeleteIcon from '@mui/icons-material/Delete';
import CreateRoundedIcon from '@mui/icons-material/CreateRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import { DraftDocument } from '../../../types'; 


export default function DraftTableMUI() {
  const drafts = mockDrafts;



  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        borderRadius: '12px',
        boxShadow: 'none',
        border: '1px solid #E5E7EB',

        '& .MuiTableCell-root': {
        height: '38px',
        maxHeight: '38px',  
        minHeight: '38px',  
        padding: '0px 16px',  
        boxSizing: 'border-box', 
        fontSize: '13px'
    },
      }}
    >
      <Table>
        {/* 테이블 헤더 */}
        <TableHead>
          <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
            <TableCell 
              sx={{ 
                fontWeight: 600, 
                color: '#6B7280',
                fontSize: '14px',
                borderBottom: '1px solid #E5E7EB',
              }}
              width="15%"
            >
              계약유형
            </TableCell>
            <TableCell 
              sx={{ 
                fontWeight: 600, 
                color: '#6B7280',
                fontSize: '14px',
                borderBottom: '1px solid #E5E7EB',
              }}
              width="40%"
            >
              계약서 제목
            </TableCell>
            <TableCell 
              sx={{ 
                fontWeight: 600, 
                color: '#6B7280',
                fontSize: '14px',
                borderBottom: '1px solid #E5E7EB',
              }}
              width="15%"
            >
              최종 수정일
            </TableCell>
            <TableCell 
              sx={{ 
                fontWeight: 600, 
                color: '#6B7280',
                fontSize: '14px',
                borderBottom: '1px solid #E5E7EB',
              }}
              width="35%"
            >
              진행률
            </TableCell>
            <TableCell 
              sx={{ 
                fontWeight: 600, 
                color: '#6B7280',
                fontSize: '14px',
                borderBottom: '1px solid #E5E7EB',
              }}
              width="5%"
            >
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
        {drafts.map((draft) => (
          <DraftRow key={draft.id} draft={draft} />
        ))}
      </TableBody>
        
      </Table>

      {/* 빈 상태 */}
      {drafts.length === 0 && (
        <Box
          sx={{
            padding: '80px 40px',
            textAlign: 'center',
            backgroundColor: '#FAFBFC',
          }}
        >
          <Typography sx={{ fontSize: '64px', marginBottom: '24px', opacity: 0.5 }}>
            ✍️
          </Typography>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
            작성 중인 계약서가 없습니다
          </Typography>
          <Typography sx={{ fontSize: '15px', color: '#6B7280' }}>
            템플릿으로 새 계약서를 만들어보세요!
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// DraftRow 컴포넌트
function DraftRow({ draft }: { draft: DraftDocument }){
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    console.log('수정:', draft.id);
    handleClose();
  };

  const handleShare = () => {
    console.log('공유:', draft.id);
    handleClose();
  };

  const handleDelete = () => {
    console.log('삭제:', draft.id);
    handleClose();
  };

  return (
    <TableRow
      sx={{
        '&:hover': {
          backgroundColor: '#FAFBFC',
        },
        borderBottom: '1px solid #F3F4F6',
      }}
    >
      {/* 계약유형 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
        <Chip
          label={categoryInfo[draft.category].label}
          sx={{
            backgroundColor: '#dbeafe',
            color: '#1d4ed8;',
            fontWeight: 600,
            fontSize: '11px',
            width: '55px',
            height: '24px',
            borderRadius: '6px',
          }}
        />
      </TableCell>

      {/* 계약서 제목 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#111827',
            lineHeight: '38px',
          }}
        >
          {draft.title}
        </Typography>
      </TableCell>

      {/* 최종 수정일 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
        <Typography
          sx={{
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '38px',
          }}
        >
          {formatDateString(draft.lastEditedAt)}
        </Typography>
      </TableCell>

      {/* 진행률 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          height: '100%',
        }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={draft.progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: '#E5E7EB',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4f617b',
                  borderRadius: 3,
                },
              }}
            />
          </Box>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#4f617b',
              minWidth: '45px',
              textAlign: 'right',
            }}
          >
            {draft.progress}%
          </Typography>
        </Box>
      </TableCell>

      {/* 더보기 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            color: '#9CA3AF',
            padding: '6px',
            '&:hover': {
              backgroundColor: '#F3F4F6',
              color: '#6B7280',
              borderRadius: '5px'
            },
          }}
        >
          <MoreVertIcon sx={{ fontSize: '18px' }} />
        </IconButton>

        {/* 드롭다운 메뉴 */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
              minWidth: '180px',
              mt: 0.5,
            },
          }}
        >
          {/* 수정 */}
          <MenuItem 
            onClick={handleEdit}
            sx={{
              padding: '12px 16px',
              fontSize: '14px',
              '&:hover': {
                backgroundColor: '#F9FAFB',
              },
            }}
          >
            <ListItemIcon>
              <CreateRoundedIcon  sx={{ fontSize: '20px', color: '#374151' }} />
            </ListItemIcon>
            <ListItemText 
              primary="수정" 
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
              }}
            />
          </MenuItem>

          {/* 공유 */}
          <MenuItem 
            onClick={handleShare}
            sx={{
              padding: '12px 16px',
              fontSize: '14px',
              '&:hover': {
                backgroundColor: '#F9FAFB',
              },
            }}
          >
            <ListItemIcon>
              <ShareRoundedIcon sx={{ fontSize: '20px', color: '#374151' }} />
            </ListItemIcon>
            <ListItemText 
              primary="공유" 
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
              }}
            />
          </MenuItem>

          {/* 구분선 */}
          <Divider sx={{ my: 0.5 }} />

          {/* 삭제 */}
          <MenuItem 
            onClick={handleDelete}
            sx={{
              padding: '12px 16px',
              fontSize: '14px',
              '&:hover': {
                backgroundColor: '#FEF2F2',
              },
            }}
          >
            <ListItemIcon>
              <DeleteIcon sx={{ fontSize: '20px', color: '#DC2626' }} />
            </ListItemIcon>
            <ListItemText 
              primary="삭제" 
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#DC2626',
              }}
            />
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}
  // 날짜 포맷 함수
  function formatDateString(dateString: string) {  // ← 이름 변경!
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}