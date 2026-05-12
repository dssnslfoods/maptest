import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Eye,
  EyeOff,
  GraduationCap,
  Key,
  Loader2,
  Pencil,
  Save,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { GRADE_LABELS } from '@/lib/utils';
import {
  adminCreateUser,
  adminDeleteUser,
  adminResetPassword,
  adminUpdateProfile,
} from '@/features/admin/user-management';
import type { Profile, UserRole } from '@/types/database';

export function UserManagementSection() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.profile);
  const isAdmin = me?.role === 'admin';
  const isTeacher = me?.role === 'teacher';
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);

  // RLS will already scope what comes back:
  //   admin → everyone
  //   teacher → own students + self
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-all-users', me?.id, me?.role],
    enabled: !!me,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  // Teachers list — admins use this for the "assign to teacher" dropdown when
  // creating/editing students. Teachers don't need it.
  const { data: teachers } = useQuery({
    queryKey: ['admin-teachers'],
    enabled: isAdmin,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('full_name');
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const visibleUsers = (users ?? []).filter((u) => {
    // For teachers, hide their own admin/teacher row noise — but show themselves
    if (isTeacher && u.id !== me?.id && u.role !== 'student') return false;
    const okSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.school_name ?? '').toLowerCase().includes(search.toLowerCase());
    const okRole = !isAdmin || roleFilter === 'all' || u.role === roleFilter;
    return okSearch && okRole;
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) =>
      adminDeleteUser(userId, {
        isStudentOfCaller: true,
        callerRole: me!.role,
      }),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['admin-all-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const counts = {
    student: (users ?? []).filter((u) => u.role === 'student').length,
    teacher: (users ?? []).filter((u) => u.role === 'teacher').length,
    admin: (users ?? []).filter((u) => u.role === 'admin').length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isTeacher ? (
            <GraduationCap className="h-5 w-5 text-primary" />
          ) : (
            <Users className="h-5 w-5 text-primary" />
          )}
          {isTeacher ? 'My students' : 'User management'}
        </CardTitle>
        <CardDescription>
          {isTeacher
            ? 'Create and manage the students assigned to you.'
            : 'Create student, teacher, and admin accounts. Edit roles or delete users.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <>
              <Badge variant="info">{counts.student} students</Badge>
              <Badge variant="success">{counts.teacher} teachers</Badge>
              <Badge variant="warning">{counts.admin} admins</Badge>
            </>
          ) : (
            <Badge variant="info">{counts.student} students</Badge>
          )}
          <div className="ml-auto">
            <Button onClick={() => setShowCreate((s) => !s)} variant={showCreate ? 'ghost' : 'default'}>
              {showCreate ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {showCreate ? 'Close' : isTeacher ? 'New student' : 'New user'}
            </Button>
          </div>
        </div>

        {showCreate && (
          <CreateUserForm
            isAdmin={isAdmin}
            teachers={teachers ?? []}
            onDone={() => {
              setShowCreate(false);
              qc.invalidateQueries({ queryKey: ['admin-all-users'] });
            }}
          />
        )}

        <div className={`grid gap-3 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-1'}`}>
          <Input
            placeholder="Search by name or school…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={isAdmin ? 'sm:col-span-2' : ''}
          />
          {isAdmin && (
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}>
              <option value="all">All roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </Select>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {isAdmin && <TableHead>Role</TableHead>}
                <TableHead>Grade</TableHead>
                <TableHead>School</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.full_name}
                    {u.id === me?.id && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        You
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Badge
                        variant={u.role === 'admin' ? 'warning' : u.role === 'teacher' ? 'success' : 'info'}
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>{u.grade_level !== null ? GRADE_LABELS[u.grade_level] : '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.school_name ?? '—'}</TableCell>
                  <TableCell className="space-x-1 text-right">
                    {/* Teachers can only edit own students (id != me, role=student) */}
                    {(isAdmin || (isTeacher && u.role === 'student' && u.id !== me?.id)) && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => setEditTarget(u)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setResetTarget(u)} title="Reset password">
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (u.id === me?.id) {
                              toast.error('You cannot delete your own account');
                              return;
                            }
                            if (confirm(`Delete ${u.full_name}? This cannot be undone.`)) deleteUser.mutate(u.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {visibleUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="py-6 text-center text-sm text-muted-foreground">
                    No users match the filter
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent onClose={() => setEditTarget(null)}>
          {editTarget && (
            <EditUserForm
              user={editTarget}
              isAdmin={isAdmin}
              teachers={teachers ?? []}
              onDone={() => {
                setEditTarget(null);
                qc.invalidateQueries({ queryKey: ['admin-all-users'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent onClose={() => setResetTarget(null)}>
          {resetTarget && (
            <ResetPasswordForm
              user={resetTarget}
              callerRole={me!.role}
              onDone={() => setResetTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CreateUserForm({
  isAdmin,
  teachers,
  onDone,
}: {
  isAdmin: boolean;
  teachers: Profile[];
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student' as UserRole,
    gradeLevel: '5',
    schoolName: '',
    teacherId: teachers[0]?.id ?? '',
  });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    try {
      await adminCreateUser({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: isAdmin ? form.role : 'student',
        gradeLevel: (isAdmin ? form.role : 'student') === 'student' ? Number(form.gradeLevel) : null,
        schoolName: form.schoolName.trim() || null,
        teacherId:
          isAdmin && form.role === 'student' && form.teacherId
            ? form.teacherId
            : null,
      });
      toast.success(`Account created`);
      onDone();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setBusy(false);
    }
  };

  const effectiveRole: UserRole = isAdmin ? form.role : 'student';

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/50 bg-white/40 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <UserPlus className="h-4 w-4 text-primary" />
        {isAdmin ? 'Create a new account' : 'Create a new student'}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cu-email">Email</Label>
          <Input
            id="cu-email"
            type="email"
            required
            placeholder="student@school.edu"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cu-pw">Password (min 6 chars)</Label>
          <div className="relative">
            <Input
              id="cu-pw"
              type={showPw ? 'text' : 'password'}
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle visibility"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cu-name">Full name</Label>
          <Input
            id="cu-name"
            required
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
        </div>
        {isAdmin && (
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
        )}
        {effectiveRole === 'student' && (
          <div className="space-y-1.5">
            <Label>Grade level</Label>
            <Select
              value={form.gradeLevel}
              onChange={(e) => setForm((f) => ({ ...f, gradeLevel: e.target.value }))}
            >
              {Object.entries(GRADE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
        )}
        {isAdmin && effectiveRole === 'student' && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Assigned teacher</Label>
            <Select
              value={form.teacherId}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
            >
              <option value="">— Unassigned —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cu-school">School (optional)</Label>
          <Input
            id="cu-school"
            value={form.schoolName}
            onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Create {isAdmin ? 'user' : 'student'}
        </Button>
      </div>
    </form>
  );
}

function EditUserForm({
  user,
  isAdmin,
  teachers,
  onDone,
}: {
  user: Profile;
  isAdmin: boolean;
  teachers: Profile[];
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    full_name: user.full_name,
    role: user.role,
    grade_level: user.grade_level == null ? '' : String(user.grade_level),
    school_name: user.school_name ?? '',
    teacher_id: user.teacher_id ?? '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const patch: Parameters<typeof adminUpdateProfile>[1] = {
        full_name: form.full_name,
        school_name: form.school_name.trim() || null,
      };
      if (isAdmin) {
        patch.role = form.role;
        if (form.role === 'student') {
          patch.grade_level = form.grade_level !== '' ? Number(form.grade_level) : null;
          patch.teacher_id = form.teacher_id || null;
        }
      } else {
        // teacher — own students only; role stays student
        patch.grade_level = form.grade_level !== '' ? Number(form.grade_level) : null;
      }
      await adminUpdateProfile(user.id, patch);
      toast.success('User updated');
      onDone();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <DialogHeader>
        <DialogTitle>Edit user</DialogTitle>
        <DialogDescription>
          {isAdmin ? 'Update role, grade, school, or teacher assignment.' : 'Update name, grade, or school.'}
        </DialogDescription>
      </DialogHeader>
      <div>
        <Label>Full name</Label>
        <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {isAdmin && (
          <div>
            <Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
        )}
        {(isAdmin ? form.role === 'student' : true) && (
          <div>
            <Label>Grade</Label>
            <Select value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })}>
              <option value="">—</option>
              {Object.entries(GRADE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      {isAdmin && form.role === 'student' && (
        <div>
          <Label>Assigned teacher</Label>
          <Select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
            <option value="">— Unassigned —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label>School</Label>
        <Input value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>
    </form>
  );
}

function ResetPasswordForm({
  user,
  callerRole,
  onDone,
}: {
  user: Profile;
  callerRole: UserRole;
  onDone: () => void;
}) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    try {
      await adminResetPassword(user.id, pw, callerRole);
      toast.success('Password reset');
      onDone();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <DialogHeader>
        <DialogTitle>Reset password</DialogTitle>
        <DialogDescription>Set a new password for {user.full_name}</DialogDescription>
      </DialogHeader>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          minLength={6}
          required
          placeholder="New password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
          Reset password
        </Button>
      </div>
    </form>
  );
}
