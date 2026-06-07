import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // We always return 200 to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_PORT ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      !process.env.SMTP_FROM
    ) {
      console.error("Missing SMTP credentials in environment variables.");
      return NextResponse.json(
        { error: "Service indisponible" },
        { status: 503 },
      );
    }

    // Rate limiting: Check if user already has an unexpired token
    const existingToken = await prisma.resetToken.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingToken) {
      return NextResponse.json({ success: true }); // Silently ignore to prevent spam
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.resetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
        <p>Ce lien est valide pendant 1 heure.</p>
        <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
