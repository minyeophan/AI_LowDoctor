
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
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
 import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import { StorageDocument } from '../../../types';
import { mockStorageDocuments, categoryInfo } from '../../../mock/mockDocuments';

export default function StorageTableMUI() {
  const documents = mockStorageDocuments;

  const columnWidths = {
    category: '15%',
    title: '40%',
    date: '15%',
    status: '35%',
    actions: '5%',
  };

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        borderRadius: '12px',
        boxShadow: 'none',
        border: '1px solid #E5E7EB',
        '& .MuiTableCell-root': {
          height: '38px',
          minHeight: '38px',
          maxHeight: '38px',
          padding: '0 16px',
          boxSizing: 'border-box',
        },
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
            <TableCell 
              width={columnWidths.category}
              sx={{ 
                fontWeight: 600, 
                color: '#6B7280',
                fontSize: '13px',
                borderBottom: '1px solid #E5E7EB',
              }}
              
            >
              계약유형
            </TableCell>
            <TableCell 
              width={columnWidths.title}
              sx={{ 
                fontWeight: 600, 
                color: '#6B7280',
                fontSize: '13px',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              계약서 제목
            </TableCell>
            <TableCell 
              width={columnWidths.date}
              sx={{ 
                fontWeight: 600, 
                color: '#6B7280',
                fontSize: '13px',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              업로드일
            </TableCell>
            <TableCell 
              width={columnWidths.status}
              sx={{ 
                fontWeight: 600, 
                color: '#6B7280',
                fontSize: '13px',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              분석상태
            </TableCell>
            <TableCell 
              width={columnWidths.actions}
              sx={{ 
                fontWeight: 600, 
                color: '#6B7280',
                fontSize: '14px',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {documents.map((doc) => (
            <StorageRow key={doc.id} document={doc} />
          ))}
        </TableBody>
      </Table>

      {documents.length === 0 && (
        <Box
          sx={{
            padding: '80px 40px',
            textAlign: 'center',
            backgroundColor: '#FAFBFC',
          }}
        >
          <Typography sx={{ fontSize: '64px', marginBottom: '24px', opacity: 0.5 }}>
            📁
          </Typography>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
            보관 중인 계약서가 없습니다
          </Typography>
          <Typography sx={{ fontSize: '15px', color: '#6B7280' }}>
            계약서를 업로드하거나 작성해보세요!
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
}

// 각 행 컴포넌트
function StorageRow({ document }: { document: StorageDocument }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    console.log('보기:', document.id);
    handleClose();
  };

  const handleDownload = () => {
    console.log('다운로드:', document.id);
    handleClose();
  };

  const handleDelete = () => {
    console.log('삭제:', document.id);
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
          label={categoryInfo[document.category].label}
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
          {document.title}
        </Typography>
      </TableCell>

      {/* 업로드일 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
        <Typography
          sx={{
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '38px',
          }}
        >
          {formatDateString(document.uploadedAt)}
        </Typography>
      </TableCell>

      {/* 분석상태 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {document.analysisStatus === 'completed' ? (
            <>
              <CheckCircleIcon sx={{ fontSize: '18px', color: '#10B981' }} />
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#10B981',
                }}
              >
                분석 완료
              </Typography>
            </>
          ) : (
            <>
              <AccessTimeFilledRoundedIcon sx={{ fontSize: '18px', color: '#F59E0B' }} />
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#F59E0B',
                }}
              >
                미분석
              </Typography>
            </>
          )}
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
          {/* 보기 */}
          <MenuItem 
            onClick={handleView}
            sx={{
              padding: '12px 16px',
              fontSize: '14px',
              '&:hover': {
                backgroundColor: '#F9FAFB',
              },
            }}
          >
            <ListItemIcon>
              <RemoveRedEyeIcon sx={{ fontSize: '20px', color: '#374151' }} />
            </ListItemIcon>
            <ListItemText 
              primary="보기" 
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
              }}
            />
          </MenuItem>

          {/* 다운로드 */}
          <MenuItem 
            onClick={handleDownload}
            sx={{
              padding: '12px 16px',
              fontSize: '14px',
              '&:hover': {
                backgroundColor: '#F9FAFB',
              },
            }}
          >
            <ListItemIcon>
              <DownloadIcon sx={{ fontSize: '20px', color: '#374151' }} />
            </ListItemIcon>
            <ListItemText 
              primary="다운로드" 
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
function formatDateString(dateString: string) {
  const date = new Date(dateString);
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}