'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent,CardFooter } from "@/components/ui/card";
import { Clock } from "lucide-react";

type Match = {
  id: string;
  date: Date;

  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
};


function formatOpponentName(name: string): string {
  const mapping: { [key: string]: string } = {
    "Los Angeles Sparks": "L.A. Sparks",
    "Washington Mystics": "Washington",
    "Phoenix Mercury": "Phoenix",
    "New York Liberty": "NY Liberty",
    "Golden State Valkyries": "Golden State",
  };
  return mapping[name] || name;
}

export default function ValkyriesSchedulePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocalTimes, setShowLocalTimes] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const getMatches = async () => {
      const teamCodes = ['gsv', 'nyl', 'phx'];
  
      const responses = await Promise.all(
        teamCodes.map(code =>
          fetch(`/api/proxy?url=${encodeURIComponent(
            `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/${code}/schedule`
          )}`).then(res => res.json())
        )
      );
  
      const now = new Date();
      const nowMinus5h = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  
      const seenMatchIds = new Set();
  
      const allMatches: Match[] = [];
  
      for (const data of responses) {
        for (const event of data.events) {
          const date = new Date(event.date);
          if (date <= nowMinus5h || seenMatchIds.has(event.id)) continue;
  
          seenMatchIds.add(event.id);
  
          const [team1, team2] = event.competitions[0].competitors;
          const t1 = team1.team;
          const t2 = team2.team;
  
          allMatches.push({
            id: event.id,
            date,
            team1: {
              name: formatOpponentName(t1.displayName),
              logo: t1.logos?.[0]?.href ?? '',
            },
            team2: {
              name: formatOpponentName(t2.displayName),
              logo: t2.logos?.[0]?.href ?? '',
            }
          });
        }
      }
  
      // Tri par date
      allMatches.sort((a, b) => a.date.getTime() - b.date.getTime());
  
      setMatches(allMatches);
      setLoading(false);
    };
  
    getMatches();
  }, []);
  

  if (loading) return <p className="p-4">Les matchs arrivent.....</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
    <ul className="space-y-4">
      {matches.map((match) => {
        // Heure formatée en heure française
        const hourLabel = new Date(match.date).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris',
        });
  
    // Convertir en heure de Paris
const dateInParis = new Date(match.date.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));

// Si l'heure à Paris est < 8h, on considère que c'est la veille
if (dateInParis.getHours() < 8) {
  dateInParis.setDate(dateInParis.getDate() - 1);
}

// Jour du match (ex : JEUDI 2 MAI au lieu de VENDREDI 3 MAI à 4h)
const dayLabel = dateInParis.toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Paris',
}).toUpperCase();
  
        return (
          <li key={match.id}>
            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow rounded-xl">
              {/* En-tête avec la date */}
              <CardHeader className="text-center border-b p-4">
                <p className="text-xl font-semibold text-gray-800 tracking-wide">
                  {dayLabel}
                </p>
              </CardHeader>
  
              {/* Corps : logos + noms des équipes + heure */}
              <CardContent className="flex flex-col items-center justify-center gap-3 py-4">
                {/* Logos équipes avec "vs" */}
                <div className="flex items-center gap-12">
                  <img
                    src={match.team1.logo}
                    alt={match.team1.name}
                    className="w-12 h-12 object-contain rounded"
                  />
                  <span className="text-gray-600 font-semibold">vs</span>
                  <img
                    src={match.team2.logo}
                    alt={match.team2.name}
                    className="w-12 h-12 object-contain rounded"
                  />
                </div>
  
           
  
                {/* Heure du match */}
                <div className="flex items-center gap-1 text-sm text-gray-700 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>{hourLabel}</span>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  </div>
  
  

  );
}
