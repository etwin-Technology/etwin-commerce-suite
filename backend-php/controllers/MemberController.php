<?php
/**
 * MemberController — Team members (CRUD) inside a store.
 *
 * Only the store owner may manage team members (server-side enforced).
 * Feature gated behind the Pro plan.
 *
 * Routes:
 *   GET    /api/members            list
 *   POST   /api/members            invite
 *   PATCH  /api/members/{id}       update role/permissions/active
 *   DELETE /api/members/{id}       remove
 */
class MemberController {

    private static function ensureOwner(): array {
        $ctx = Http::ownedTenant(); // already validates auth + tenant ownership
        return $ctx; // owner = the auth user, since stores.owner_id = user
    }

    private static function ensurePro(array $store): void {
        if (!($store['plan'] === 'pro' && (bool)$store['plan_active'] && strtotime($store['plan_expires_at']) > time())) {
            Http::fail("La gestion d'équipe nécessite le plan Pro.", 402);
        }
    }

    private static function row(array $r): array {
        return [
            'id'          => $r['id'],
            'storeId'     => $r['tenant_id'],
            'userId'      => $r['user_id'],
            'email'       => $r['email'],
            'fullName'    => $r['full_name'],
            'role'        => $r['role'],
            'permissions' => json_decode($r['permissions'] ?? '{}', true) ?: new stdClass(),
            'active'      => (bool)$r['active'],
            'invitedAt'   => $r['invited_at'],
        ];
    }

    public static function list(): void {
        $ctx = self::ensureOwner();
        $st = DB::pdo()->prepare('SELECT * FROM store_members WHERE tenant_id = ? ORDER BY invited_at DESC');
        $st->execute([$ctx['store']['id']]);
        Http::json(array_map([self::class, 'row'], $st->fetchAll()));
    }

    public static function create(): void {
        $ctx = self::ensureOwner();
        self::ensurePro($ctx['store']);
        $b   = Http::body();
        $in  = Http::require($b, ['email','fullName','role']);
        $role = in_array($in['role'], ['owner','sales','stock','custom']) ? $in['role'] : 'custom';
        $perms = is_array($b['permissions'] ?? null) ? $b['permissions'] : [];
        $id    = DB::uuid();

        $pdo = DB::pdo();
        // try to link to an existing user by email
        $u = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $u->execute([$in['email']]);
        $userId = $u->fetchColumn() ?: null;

        try {
            $pdo->prepare(
                'INSERT INTO store_members (id, tenant_id, user_id, email, full_name, role, permissions, active)
                 VALUES (?,?,?,?,?,?,?,1)'
            )->execute([$id, $ctx['store']['id'], $userId, $in['email'], $in['fullName'], $role, json_encode($perms)]);
        } catch (PDOException $e) {
            if ((int)$e->errorInfo[1] === 1062) Http::fail('Ce membre existe déjà.', 409);
            throw $e;
        }

        $st = $pdo->prepare('SELECT * FROM store_members WHERE id = ?');
        $st->execute([$id]);
        Http::json(self::row($st->fetch()), 201);
    }

    public static function update(string $id): void {
        $ctx = self::ensureOwner();
        self::ensurePro($ctx['store']);
        $b   = Http::body();
        $sets = []; $vals = [];
        if (isset($b['role'])) {
            if (!in_array($b['role'], ['owner','sales','stock','custom'])) Http::fail('Bad role', 422);
            $sets[] = 'role = ?'; $vals[] = $b['role'];
        }
        if (isset($b['permissions']) && is_array($b['permissions'])) {
            $sets[] = 'permissions = ?'; $vals[] = json_encode($b['permissions']);
        }
        if (isset($b['active']))   { $sets[] = 'active = ?';    $vals[] = (int)(bool)$b['active']; }
        if (isset($b['fullName'])) { $sets[] = 'full_name = ?'; $vals[] = (string)$b['fullName']; }
        if (!$sets) Http::fail('Nothing to update', 400);
        $vals[] = $id; $vals[] = $ctx['store']['id'];
        DB::pdo()->prepare('UPDATE store_members SET ' . implode(',', $sets) . ' WHERE id = ? AND tenant_id = ?')
            ->execute($vals);
        $st = DB::pdo()->prepare('SELECT * FROM store_members WHERE id = ? AND tenant_id = ?');
        $st->execute([$id, $ctx['store']['id']]);
        $row = $st->fetch();
        if (!$row) Http::fail('Not found', 404);
        Http::json(self::row($row));
    }

    public static function delete(string $id): void {
        $ctx = self::ensureOwner();
        DB::pdo()->prepare('DELETE FROM store_members WHERE id = ? AND tenant_id = ?')
            ->execute([$id, $ctx['store']['id']]);
        Http::json(['ok' => true]);
    }
}
