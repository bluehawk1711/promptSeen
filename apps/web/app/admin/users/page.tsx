"use client";

import { Loader2, Shield, ShieldOff, Users as UsersIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAdminUsers, useToggleUserAdmin } from "@/lib/admin-queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedTableRow,
} from "@/components/motion/motion-components";

/**
 * Admin Users management page — view and manage admin users.
 * Current admin cannot revoke their own admin access.
 */
export default function UsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const { user: currentUser } = useAuth();
  const toggleAdminMutation = useToggleUserAdmin();

  const toggleAdmin = (user: { uid: string; isAdmin: boolean }) => {
    if (user.uid === currentUser?.uid) return;
    toggleAdminMutation.mutate({ uid: user.uid, isAdmin: !user.isAdmin });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <PageTransition className="flex flex-col gap-6">
      <FadeIn>
        <div>
          <h1 className="text-xl font-medium md:text-2xl">Users</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} registered users, {adminCount} admins
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UsersIcon className="size-8" />
                        <p className="text-sm">No users yet. Users will appear here after signing up.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, i) => {
                    const isCurrentUser = user.uid === currentUser?.uid;
                    return (
                      <AnimatedTableRow key={user.uid} index={i} className="group">
                        <TableCell className="font-mono text-sm">
                          {user.email}
                          {isCurrentUser && (
                            <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.displayName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={user.isAdmin ? "default" : "secondary"}>
                            {user.isAdmin ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {isCurrentUser ? (
                            <span className="text-xs text-muted-foreground">
                              Current user
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAdmin(user)}
                              disabled={toggleAdminMutation.isPending}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {user.isAdmin ? (
                                <ShieldOff size={14} className="mr-1" />
                              ) : (
                                <Shield size={14} className="mr-1" />
                              )}
                              {user.isAdmin ? "Revoke Admin" : "Make Admin"}
                            </Button>
                          )}
                        </TableCell>
                      </AnimatedTableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeIn>
    </PageTransition>
  );
}
