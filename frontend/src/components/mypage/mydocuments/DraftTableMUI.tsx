import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Box, Typography, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import { useNavigate } from 'react-router-dom';
import { categoryInfo, mockDrafts } from '../../../mock/mockDocuments';
import { mypageAPI } from '../../../api/mypage';
import { DraftDocument } from '../../../types';

interface DraftTableProps {
  sortOrder: string;
  categoryFilter: string;
  searchQuery: string;
}

export default function DraftTableMUI({ sortOrder, categoryFilter, searchQuery }: DraftTableProps) {
  const [drafts, setDrafts] = useState<DraftDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const sort = sortOrder === 'recent' ? 'recent' : sortOrder === 'oldest' ? 'old' : 'name';
        const data = await mypageAPI.getDrafts(sort, categoryFilter === 'all' ? '' : categoryFilter);
        const mapped = data.list.map((item: any) => ({
          id: item.documentId,
          title: item.title,
          category: 'real_estate',
          progress: item.progress || 0,
          statusText: item.statusText || '미분석',
          lastEditedAt: item.uploadDate ?? item.updatedAt ?? '',
        }));
        const filtered = searchQuery
          ? mapped.filter((d: DraftDocument) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
          : mapped;
        setDrafts(filtered);
      } catch (err) {
        console.error('미분석 목록 로딩 실패:', err);
        setDrafts(mockDrafts);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [sortOrder, categoryFilter, searchQuery]);

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
          fontSize: '13px',
        },
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
            <TableCell width="15%" sx={{ fontWeight: 600, color: '#6B7280', fontSize: '13px', borderBottom: '1px solid #E5E7EB' }}>
              계약 유형
            </TableCell>
            <TableCell width="40%" sx={{ fontWeight: 600, color: '#6B7280', fontSize: '13px', borderBottom: '1px solid #E5E7EB' }}>
              계약서 제목
            </TableCell>
            <TableCell width="15%" sx={{ fontWeight: 600, color: '#6B7280', fontSize: '13px', borderBottom: '1px solid #E5E7EB' }}>
              업로드일
            </TableCell>
            <TableCell width="25%" sx={{ fontWeight: 600, color: '#6B7280', fontSize: '13px', borderBottom: '1px solid #E5E7EB' }}>
              분석 상태
            </TableCell>
            <TableCell width="5%" sx={{ borderBottom: '1px solid #E5E7EB' }} />
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} sx={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                로딩 중...
              </TableCell>
            </TableRow>
          ) : drafts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} sx={{ padding: 0, border: 'none' }}>
                <Box sx={{ padding: '60px 40px', textAlign: 'center', backgroundColor: '#fff' }}>
                  <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                    미분석 계약서가 없습니다
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            drafts.map((draft) => (
              <DraftRow key={draft.id} draft={draft} />
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DraftRow({ draft }: { draft: DraftDocument }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // ✅ 보기 — 분석 페이지로 이동
  const handleView = () => {
    handleClose();
    navigate('/analysis', {
      state: { documentId: draft.id, filename: draft.title, autoAnalyze: true },
    });
  };

  const handleDelete = () => {
    console.log('삭제:', draft.id);
    handleClose();
  };

  return (
    <TableRow
      sx={{
        '&:hover': { backgroundColor: '#FAFBFC' },
        borderBottom: '1px solid #F3F4F6',
      }}
    >
      {/* 계약유형 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
        <Chip
          label={categoryInfo[draft.category]?.label ?? '부동산'}
          sx={{
            backgroundColor: '#dbeafe',
            color: '#1d4ed8',
            fontWeight: 600,
            fontSize: '11px',
            width: '55px',
            height: '24px',
            borderRadius: '6px',
          }}
        />
      </TableCell>

      {/* 계약서 제목 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6', maxWidth: 0 }}>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#111827',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {draft.title}
        </Typography>
      </TableCell>

      {/* 업로드일 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
          {formatDateString(draft.lastEditedAt)}
        </Typography>
      </TableCell>

      {/* ✅ 분석 상태 */}
      <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeFilledRoundedIcon sx={{ fontSize: '18px', color: '#F59E0B' }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#F59E0B' }}>
            {draft.statusText || '미분석'}
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
            '&:hover': { backgroundColor: '#F3F4F6', color: '#6B7280', borderRadius: '5px' },
          }}
        >
          <MoreVertIcon sx={{ fontSize: '18px' }} />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
          {/* ✅ 보기 — 분석 페이지로 이동 */}
          <MenuItem onClick={handleView} sx={{ padding: '12px 16px', '&:hover': { backgroundColor: '#F9FAFB' } }}>
            <ListItemIcon>
              <RemoveRedEyeIcon sx={{ fontSize: '20px', color: '#374151' }} />
            </ListItemIcon>
            <ListItemText
              primary="보기"
              primaryTypographyProps={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}
            />
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          {/* 삭제 */}
          <MenuItem onClick={handleDelete} sx={{ padding: '12px 16px', '&:hover': { backgroundColor: '#FEF2F2' } }}>
            <ListItemIcon>
              <DeleteIcon sx={{ fontSize: '20px', color: '#DC2626' }} />
            </ListItemIcon>
            <ListItemText
              primary="삭제"
              primaryTypographyProps={{ fontSize: '14px', fontWeight: 500, color: '#DC2626' }}
            />
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}

function formatDateString(dateString: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}