import type { NextApiRequest, NextApiResponse } from 'next';
import { calculateAge, generateMedicalRecord } from '@/lib/utils';
import prisma from '@/lib/database';
import { Patient } from '@/lib/types';

async function advancedSearch(attributeName: string, attributeValue: string, matchType: string): Promise<Patient[]> {
  if (!attributeName || !attributeValue) {
    return [];
  }

  const searchValue = attributeValue.toLowerCase();

  const whereClause: Record<string, unknown> = {};

  if (['gender', 'maritalStatus', 'evera', 'bloodType', 'rhFactor'].includes(attributeName)) {
    // For enum fields, search by integer value
    const enumMap: Record<string, Record<string, number>> = {
      gender: { masculino: 0, femenino: 1 },
      maritalStatus: { casado: 0, divorciado: 1, soltero: 2, unionlibre: 3, viudo: 4 },
      evera: { leve: 0, moderado: 1, fuerte: 2, muyfuerte: 3, insoportable: 4 },
      bloodType: { a: 0, b: 1, ab: 2, o: 3 },
      rhFactor: { negativo: 0, positivo: 1 },
    };

    const enumValues = enumMap[attributeName];
    if (enumValues) {
      const matchingValues = Object.entries(enumValues)
        .filter(([key]) => {
          switch (matchType) {
            case 'starts_with': return key.startsWith(searchValue);
            case 'ends_with': return key.endsWith(searchValue);
            case 'contains': return key.includes(searchValue);
            default: return key === searchValue;
          }
        })
        .map(([, value]) => value);

      if (matchingValues.length > 0) {
        whereClause[attributeName] = { in: matchingValues };
      } else {
        return [];
      }
    }
  } else {
    // For text fields, use string matching (SQLite doesn't support case-insensitive mode)
    const field = attributeName as keyof typeof prisma.patient.fields;
    switch (matchType) {
      case 'starts_with':
        whereClause[field] = { startsWith: attributeValue };
        break;
      case 'ends_with':
        whereClause[field] = { endsWith: attributeValue };
        break;
      case 'contains':
        whereClause[field] = { contains: attributeValue };
        break;
      case 'exact':
      default:
        whereClause[field] = attributeValue;
        break;
    }
  }

  return prisma.patient.findMany({
    where: whereClause,
    orderBy: { name: 'asc' },
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { attribute_name, attribute_value, match_type, page } = req.query;

      if (!attribute_name || !attribute_value) {
        return res.status(400).json({ error: 'attribute_name and attribute_value are required' });
      }

      const results = await advancedSearch(
        attribute_name as string,
        attribute_value as string,
        (match_type as string) || 'exact'
      );

      // Simple pagination (5 items per page)
      const pageNum = parseInt(page as string) || 1;
      const itemsPerPage = 5;
      const startIndex = (pageNum - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedResults = results.slice(startIndex, endIndex);

      const patientsWithAge = paginatedResults.map(patient => ({
        ...patient,
        age: calculateAge(patient.birthDate),
        medical_record: patient.medicalRecord || generateMedicalRecord(patient.id as number)
      }));

      res.status(200).json({
        patients: patientsWithAge,
        total: results.length,
        page: pageNum,
        totalPages: Math.ceil(results.length / itemsPerPage)
      });
    } catch (error) {
      console.error('Error in advanced search:', error);
      res.status(500).json({ error: 'Error performing search' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
