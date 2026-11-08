import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isMailConfigured } from "@/lib/mail";
import { isTelegramConfigured } from "@/lib/telegram";
import NavBar from "@/components/NavBar";
import SettingsCard from "@/components/SettingsCard";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-7 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Settings</h1>
        <p className="mt-1 text-xs text-zinc-500">
          Connect the nightly Telegram update + optional email back-up.
        </p>
        <div className="mt-6">
          <SettingsCard
            accountEmail={user.email}
            reportEmail={user.reportEmail}
            mailConfigured={isMailConfigured()}
            telegramChatId={user.telegramChatId}
            telegramConfigured={isTelegramConfigured()}
          />
        </div>
      </main>
    </>
  );
}